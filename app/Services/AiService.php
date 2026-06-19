<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\Publication;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\AiMemory;
use App\Models\AiContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser;

class AiService
{
    protected string $provider;
    protected ?string $claudeKey;
    protected ?string $openaiKey;
    protected ?string $groqKey;
    protected ?string $geminiKey;
    protected ?string $serperKey;
    protected ?string $tavilyKey;
    protected string $ollamaHost;
    protected string $ollamaModel;
    protected int $maxTokens;
    protected float $temperature;

    public function __construct()
    {
        $this->provider = config('ai.provider', env('AI_PROVIDER', 'claude'));
        $this->claudeKey = config('ai.anthropic_key', env('ANTHROPIC_API_KEY'));
        $this->openaiKey = config('ai.openai_key', env('OPENAI_API_KEY'));
        $this->groqKey   = config('ai.groq_key',   env('GROQ_API_KEY'));
        $this->geminiKey = config('ai.gemini_key',  env('GEMINI_API_KEY'));
        $this->serperKey = config('ai.serper_key',  env('SERPER_API_KEY'));
        $this->tavilyKey = config('ai.tavily_key',  env('TAVILY_API_KEY'));
        $this->ollamaHost = config('ai.ollama_host', env('OLLAMA_HOST', 'http://localhost:11434'));
        $this->ollamaModel = config('ai.ollama_model', env('OLLAMA_MODEL', 'llama3.2'));
        $this->maxTokens = (int) config('ai.max_tokens', env('AI_MAX_TOKENS', 4096));
        $this->temperature = (float) config('ai.temperature', env('AI_TEMPERATURE', 0.3));
    }

    // =====================================================================
    // MOTEUR PRINCIPAL — CHATBOT NOUVELLE GÉNÉRATION (Pipeline 10 étapes)
    // =====================================================================

    /**
     * Point d'entrée principal du chatbot intelligent.
     * 
     * Pipeline complet :
     * 1. Comprendre — Analyser l'intention réelle
     * 2. Identifier l'objectif — Explicite vs implicite
     * 3. Détecter les contraintes — Format, limite, filtre, langue
     * 4. Rechercher le contexte — Mémoire + historique conversation
     * 5. Rechercher les informations — Local DB + Web conditionnel
     * 6. Vérifier les données — Cohérence, fraîcheur, complétude
     * 7. Construire la réponse — Structure selon contraintes
     * 8. Auto-évaluer — Validation des contraintes
     * 9. Réponse finale — Avec confiance + sources
     * 10. Mémorisation — Persistance des décisions/préférences clés
     */
    public function chatAssistant(
        string $question,
        array $context,
        ?int $userId = null,
        bool $webSearchEnabled = true,
        ?int $conversationId = null
    ): array {
        // ── ÉTAPE 0 : Détection d'ambiguïté ──────────────────────────────
        $clarification = $this->detectAmbiguity($question, $context, $userId);
        if ($clarification !== null) {
            return [
                'response'               => $clarification,
                'reasoning'              => "Étape 0 (Ambiguïté) : La question est ambiguë. Demande de clarification envoyée à l'utilisateur.",
                'confidence_score'       => 0.0,
                'sources'                => [],
                'is_clarification'       => true,
                'clarification_question' => $clarification,
                'memory_notifications'   => [],
            ];
        }

        // ── ÉTAPE 1-3 : Construire le contexte complet ───────────────────
        $contextString = $this->buildFullContext($question, $context, $userId, $conversationId);

        // ── ÉTAPE 4 : Recherche locale ───────────────────────────────────
        $localResults = $this->searchLocal($question, $userId, $context['project_id'] ?? null);
        $contextString .= "\n--- RÉSULTATS DE RECHERCHE DANS L'APPLICATION COLLABSEARCH ---\n{$localResults}\n";

        // ── ÉTAPE 5 : Recherche web conditionnelle ───────────────────────
        $webResults = "Recherche web désactivée ou non déclenchée.";
        $webSources = [];
        if ($webSearchEnabled && $this->shouldTriggerWebSearch($question)) {
            $webData = $this->searchWebStructured($question);
            $webResults = $webData['text'];
            $webSources = $webData['sources'];
        }
        $contextString .= "\n--- RÉSULTATS DE RECHERCHE SUR LE WEB ---\n{$webResults}\n";

        // ── ÉTAPE 5bis : Mode Conseiller ─────────────────────────────────
        $advisorInsights = $this->buildAdvisorInsights($context, $userId);
        if (!empty($advisorInsights)) {
            $contextString .= "\n--- INSIGHTS CONSEILLER ---\n{$advisorInsights}\n";
        }

        // ── ÉTAPES 6-9 : Construire le system prompt 10 étapes ──────────
        $systemPrompt = $this->buildSystemPrompt($contextString);

        // Appel au LLM
        $rawResponse = $this->callLlm($question, $systemPrompt);

        // Parser la réponse structurée
        $parsed = $this->parseEnhancedResponse($rawResponse);

        // ── ÉTAPE 9bis : Calculer le score de confiance ─────────────────
        if ($parsed['confidence_score'] <= 0) {
            $parsed['confidence_score'] = $this->calculateConfidence(
                $question,
                $parsed['response'],
                $contextString,
                $localResults,
                $webResults
            );
        }

        // Fusionner les sources web
        $allSources = array_merge($parsed['sources'], $webSources);
        $parsed['sources'] = array_values(array_unique($allSources, SORT_REGULAR));

        // ── ÉTAPE 10 : Mémorisation automatique ─────────────────────────
        $memoryNotifications = [];
        if ($userId) {
            $memoryNotifications = $this->autoMemorize($userId, $question, $parsed['response'], $context);
        }
        $parsed['memory_notifications'] = $memoryNotifications;

        // ── Mise à jour du résumé glissant de la conversation ───────────
        if ($conversationId) {
            $this->updateConversationSummary($conversationId, $question, $parsed['response']);
        }

        return $parsed;
    }

    // =====================================================================
    // MOTEUR DE COMPRÉHENSION — Détection d'ambiguïté
    // =====================================================================

    /**
     * Détecte si la question est ambiguë et nécessite une clarification.
     * Retourne la question de clarification ou null si la question est claire.
     */
    protected function detectAmbiguity(string $question, array $context, ?int $userId): ?string
    {
        $questionLower = mb_strtolower(trim($question));

        // Commandes de continuation — pas d'ambiguïté
        $continuationCommands = [
            'résume', 'resume', 'continue', 'développe', 'developpe',
            'explique davantage', 'fais pareil', 'encore', 'plus de détails',
            'détaille', 'detaille', 'élabore', 'elabore', 'va plus loin',
            'et ensuite', 'quoi d\'autre', "c'est tout", 'merci', 'ok', 'oui', 'non',
        ];
        foreach ($continuationCommands as $cmd) {
            if ($questionLower === $cmd || str_starts_with($questionLower, $cmd . ' ')) {
                return null; // Pas ambigu, c'est une continuation
            }
        }

        // Détection de référence vague sans contexte
        $vaguePatterns = [
            '/^montre[- ]moi le projet\.?$/u',
            '/^ouvre le fichier\.?$/u',
            '/^donne[- ]moi (le|la|les) résultat\.?$/u',
            '/^analyse (le|la|ça)\.?$/u',
            '/^supprime (ça|le|la)\.?$/u',
            '/^modifie (le|la|ça)\.?$/u',
        ];

        foreach ($vaguePatterns as $pattern) {
            if (preg_match($pattern, $questionLower)) {
                // Vérifier si le contexte peut désambiguïser
                if (!empty($context['project'])) {
                    return null; // Le contexte projet existe, pas ambigu
                }

                // Générer une question de clarification
                if (str_contains($questionLower, 'projet')) {
                    $projects = \App\Models\Project::take(5)->pluck('title')->toArray();
                    if (!empty($projects)) {
                        $list = implode(', ', array_map(fn($t) => "**{$t}**", $projects));
                        return "🤔 Quel projet souhaitez-vous consulter ? Voici vos projets disponibles : {$list}";
                    }
                    return "🤔 Quel projet souhaitez-vous consulter ? Veuillez préciser le nom du projet.";
                }

                return "🤔 Votre demande est un peu vague. Pourriez-vous préciser ce que vous souhaitez que j'analyse ou que je vous montre ?";
            }
        }

        return null; // Question claire
    }

    // =====================================================================
    // MOTEUR DE CONTEXTE — Construction du contexte complet
    // =====================================================================

    /**
     * Construit le contexte complet incluant :
     * - Données du projet actif
     * - Mémoire long terme de l'utilisateur
     * - Historique conversationnel (résumé + derniers messages)
     * - Contextes projet spécifiques
     */
    protected function buildFullContext(
        string $question,
        array $context,
        ?int $userId,
        ?int $conversationId
    ): string {
        $contextString = "";

        // ── Utilisateur connecté ──────────────────────────────────────────
        if ($userId) {
            $user = \App\Models\User::with(['customRoles'])->find($userId);
            if ($user) {
                $roleName = $user->customRoles->first()?->name ?? 'Utilisateur';
                $teams    = \App\Models\Project::whereHas('members', fn($q) => $q->where('users.id', $userId))
                    ->pluck('title')->take(5)->toArray();
                $contextString .= "=== UTILISATEUR CONNECTÉ ===\n";
                $contextString .= "ID    : {$user->id}\n";
                $contextString .= "Nom   : {$user->name}\n";
                $contextString .= "Email : {$user->email}\n";
                $contextString .= "Rôle  : {$roleName}\n";
                if (!empty($teams)) {
                    $contextString .= "Projets membres : " . implode(', ', $teams) . "\n";
                }
            }
        }

        // ── Page courante ─────────────────────────────────────────────────
        if (!empty($context['current_page'])) {
            $contextString .= "\nPage actuelle : " . $context['current_page'] . "\n";
        }

        // ── Données projet ────────────────────────────────────────────────
        if (!empty($context['project'])) {
            $project = $context['project'];
            $contextString .= "=== PROJET ACTIF ===\n";
            $contextString .= "Titre : " . ($project['title'] ?? 'Inconnu') . "\n";
            $contextString .= "Description : " . ($project['description'] ?? '') . "\n";
            $memberNames = array_column($project['members'] ?? [], 'name');
            $contextString .= "Membres : " . implode(', ', $memberNames) . "\n";
        }
        if (!empty($context['tasks'])) {
            $contextString .= "\n=== TÂCHES DU PROJET ===\n";
            foreach ($context['tasks'] as $task) {
                $status = $task['status'] ?? 'todo';
                if ($status instanceof \BackedEnum) {
                    $status = $status->value;
                }
                $contextString .= "- " . ($task['title'] ?? '') . " [Statut: {$status}, Assigné à: " . ($task['assignee'] ?? 'Aucun') . "]\n";
            }
        }
        if (!empty($context['publications'])) {
            $contextString .= "\n=== PUBLICATIONS DU PROJET ===\n";
            foreach ($context['publications'] as $pub) {
                $contextString .= "- " . ($pub['title'] ?? '') . " (Année: " . ($pub['year'] ?? '') . ")\n";
            }
        }

        // ── Mémoire long terme ────────────────────────────────────────────
        if ($userId) {
            $memories = AiMemory::where('user_id', $userId)->get();
            if ($memories->isNotEmpty()) {
                $contextString .= "\n=== MÉMOIRE & PRÉFÉRENCES UTILISATEUR ===\n";
                $grouped = $memories->groupBy('category');
                foreach ($grouped as $category => $items) {
                    $emoji = match($category) {
                        'preference'  => '⚙️',
                        'technology'  => '💻',
                        'decision'    => '🏛️',
                        'objective'   => '🎯',
                        default       => '📝',
                    };
                    $contextString .= "{$emoji} [{$category}]\n";
                    foreach ($items as $mem) {
                        $contextString .= "  - {$mem->key} : {$mem->value}\n";
                    }
                }
            }

            // Contextes projet spécifiques
            $projId = $context['project_id'] ?? ($context['project']['id'] ?? null);
            if ($projId) {
                $contexts = AiContext::where('user_id', $userId)
                    ->where('project_id', $projId)
                    ->get();
                if ($contexts->isNotEmpty()) {
                    $contextString .= "\n=== CONTEXTE SPÉCIFIQUE AU PROJET ===\n";
                    foreach ($contexts as $ctx) {
                        $contextString .= "- {$ctx->key} : {$ctx->value}\n";
                    }
                }
            }
        }

        // ── Historique conversationnel ─────────────────────────────────────
        if ($conversationId) {
            $conversation = AiConversation::find($conversationId);
            if ($conversation) {
                // Résumé glissant
                if (!empty($conversation->context_summary)) {
                    $contextString .= "\n=== RÉSUMÉ DE LA CONVERSATION PRÉCÉDENTE ===\n";
                    $contextString .= $conversation->context_summary . "\n";
                }

                // 10 derniers messages bruts pour le contexte immédiat
                $recentMessages = $conversation->messages()
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get()
                    ->reverse();

                if ($recentMessages->isNotEmpty()) {
                    $contextString .= "\n=== DERNIERS MESSAGES DE LA CONVERSATION ===\n";
                    foreach ($recentMessages as $msg) {
                        $role = $msg->role === 'user' ? 'UTILISATEUR' : 'ASSISTANT';
                        $content = Str::limit($msg->content, 500);
                        $contextString .= "[{$role}] : {$content}\n";
                    }
                }

                // Métadonnées contextuelles
                if (!empty($conversation->context_metadata)) {
                    $meta = $conversation->context_metadata;
                    if (!empty($meta['topics'])) {
                        $contextString .= "\n=== SUJETS ABORDÉS DANS CETTE CONVERSATION ===\n";
                        $contextString .= implode(', ', $meta['topics']) . "\n";
                    }
                }
            }
        }

        return $contextString;
    }

    // =====================================================================
    // MOTEUR DE RAISONNEMENT — System Prompt 10 étapes
    // =====================================================================

    /**
     * Construit le system prompt CollabAI — identité + domaine métier + règles + pipeline 10 étapes.
     */
    protected function buildSystemPrompt(string $contextString): string
    {
        return <<<SYSTEM
Tu t'appelles CollabAI. Tu es l'assistant IA expert intégré à CollabSearch, une plateforme web de gestion d'équipes de recherche universitaire (backend Laravel 11, frontend Next.js 14).

Tu es direct, efficace, professionnel. Tu agis toujours sur la base des données fournies. Si une donnée est absente, tu le signales clairement et tu proposes une action concrète. Tu parles toujours en français sauf si l'utilisateur écrit dans une autre langue.

═══════════════════════════════════════════════════
CONNAISSANCE MÉTIER — ENTITÉS DE LA PLATEFORME
═══════════════════════════════════════════════════
PROJET : titre, description, statut (en_cours/terminé/archivé/suspendu), date_début, date_fin, chef_de_projet. Contient tâches, membres, réunions et publications.
ÉQUIPE : groupe de membres sur un ou plusieurs projets. Un membre peut appartenir à plusieurs équipes.
MEMBRE / UTILISATEUR — rôles et permissions :
  • Administrateur  → accès total (lecture, écriture, suppression, rapports)
  • Chef de projet  → gère ses projets, équipes, tâches, réunions
  • Chercheur       → voit ses projets, met à jour ses tâches
  • Doctorant       → comme Chercheur mais ne peut pas créer de tâches
  • Invité          → lecture seule sur les projets où il est invité
TÂCHE : titre, statut (en_attente/en_cours/terminée/bloquée/soumise), priorité (basse/normale/haute/urgente), assigné_à, projet_id, date_limite. Une tâche bloquée doit TOUJOURS être signalée en priorité.
RÉUNION : titre, date, durée, statut (planifiée/en_cours/terminée/annulée), participants, ordre_du_jour, compte_rendu.
PUBLICATION : titre, auteurs, année, type, mots-clés, PDF attaché, analyse IA.
RAPPORT : généré depuis l'avancement d'un projet. Accessible uniquement aux rôles Administrateur et Chef de projet.

═══════════════════════════════════════════════════
CONTEXTE INJECTÉ
═══════════════════════════════════════════════════
<context>
{$contextString}
</context>
Tu dois lire ce contexte et baser TOUTES tes réponses dessus. Ne jamais inventer de données.

═══════════════════════════════════════════════════
RÈGLES DE COMPORTEMENT STRICTES
═══════════════════════════════════════════════════
RÈGLE 1 — TOUJOURS AGIR, JAMAIS SUPPOSER
  ✗ "Il est possible que..." / "Je ne suis pas sûr mais..." / "Confiance : 75%"
  ✓ "Voici vos projets actifs : ..." / "Aucune tâche trouvée." / "Données non disponibles."

RÈGLE 2 — DONNÉES DISPONIBLES → RÉPONDRE DIRECTEMENT
  Si les données sont dans le contexte, affiche-les immédiatement de façon structurée.

RÈGLE 3 — DONNÉES ABSENTES → MESSAGE CLAIR + ACTION
  → "Aucun(e) [X] trouvé(e) dans les données disponibles."
  → Propose : "Créez-en un depuis [Y]" ou "Vérifiez vos droits d'accès."

RÈGLE 4 — ERREUR SYSTÈME → DIAGNOSTIC UTILE
  → "Impossible de récupérer [X]. Cause possible : API déconnectée / droits insuffisants / données vides."
  → "Action recommandée : recharger / contacter l'admin / vérifier la connexion."

RÈGLE 5 — QUESTION HORS CONTEXTE
  Réponds brièvement et avec précision, puis ramène vers la plateforme si pertinent.

RÈGLE 6 — TOUJOURS PROPOSER UNE SUITE
  "Voulez-vous voir les détails ?" / "Souhaitez-vous créer une réunion pour débloquer cette tâche ?"

═══════════════════════════════════════════════════
PIPELINE DE RAISONNEMENT 10 ÉTAPES (OBLIGATOIRE)
═══════════════════════════════════════════════════
Avant de formuler ta réponse finale, raisonne intérieurement selon ces 10 étapes :

1. COMPRENDRE  : Que veut réellement l'utilisateur ? Quelle est l'intention derrière les mots ?
2. OBJECTIF    : Identifier l'objectif explicite ET implicite.
3. CONTRAINTES : Format, limite numérique ("les 3 plus importants"), filtre ("uniquement IA"), langue, longueur.
4. CONTEXTE    : Mémoire utilisateur, historique, résumé de conversation, sujets abordés. Pour "résume" / "continue" / "développe" → utiliser le contexte précédent.
5. INFORMATIONS: Analyser les résultats de recherche locale et web fournis dans le contexte.
6. VÉRIFICATION: Cohérence, fraîcheur et complétude des données. Détecter les tâches bloquées, délais dépassés.
7. CONSTRUCTION: Bâtir la réponse en respectant STRICTEMENT toutes les contraintes.
8. AUTO-ÉVAL   : Chaque contrainte de l'étape 3 est-elle respectée ? Sinon, reformuler.
9. CONFIANCE   : Score entre 0.0 (incertain) et 1.0 (certain). Si < 0.6, le signaler.
10. MÉMORISATION: Identifier les préférences, décisions, technologies ou objectifs à retenir.

═══════════════════════════════════════════════════
FORMAT OBLIGATOIRE DE TA RÉPONSE
═══════════════════════════════════════════════════
[REASONING]
Étape 1 (Comprendre)    : <analyse de l'intention>
Étape 2 (Objectif)      : <objectifs détectés>
Étape 3 (Contraintes)   : <contraintes identifiées>
Étape 4 (Contexte)      : <mémoire + historique>
Étape 5 (Informations)  : <données locales et web trouvées>
Étape 6 (Vérification)  : <cohérence, alertes>
Étape 7 (Construction)  : <plan de la réponse>
Étape 8 (Auto-éval)     : <contraintes respectées ?>
Étape 9 (Confiance)     : <score et justification>
Étape 10 (Mémorisation) : <éléments à retenir>
[/REASONING]

[CONFIDENCE]<score 0.0-1.0>[/CONFIDENCE]

[SOURCES]
- Titre source : URL (uniquement si sources web ou locales utilisées, sinon laisser vide)
[/SOURCES]

[ADVISOR]
<Suggestions proactives, risques détectés, optimisations — si pertinent, sinon laisser vide>
[/ADVISOR]

[RESPONSE]
<Réponse finale structurée en français (Markdown). Directe, précise, avec émojis si lisibilité améliorée.>

Structure standard :
1. Ligne d'ouverture directe (ce qui a été trouvé ou non)
2. Données structurées (liste numérotée, tableau ou résumé)
3. ⚠️ Alertes si nécessaire (tâches bloquées 🔴, délais dépassés ⏰, permissions insuffisantes 🔒)
4. → Action suivante suggérée (si pertinent)
[/RESPONSE]

═══════════════════════════════════════════════════
EXEMPLES DE BONNES RÉPONSES
═══════════════════════════════════════════════════
→ Réunions :
"Vos réunions terminées :
1. Mise au point — 19/06/2026 à 03h35 [✅ terminée]
→ Voulez-vous voir le compte-rendu ou les participants ?"

→ Projet avec tâches :
"Projet actif : Analyse NLP [🔄 en cours]
Tâches :
  ✅ Prétraitement données — terminée (Alice)
  🔄 Entraînement modèle — en cours (Bob)
  🔴 Rapport final — BLOQUÉE (non assignée)
⚠️ 1 tâche bloquée et non assignée. Voulez-vous l'assigner à un membre ?"

→ Données absentes :
"Aucun projet trouvé pour votre compte.
→ Créez-en un depuis Projets > Nouveau projet, ou vérifiez vos droits avec votre administrateur."

═══════════════════════════════════════════════════
GESTION DES CAS LIMITES
═══════════════════════════════════════════════════
| Situation                 | Comportement                                              |
|---------------------------|-----------------------------------------------------------|
| Requête ambiguë           | Déduis l'intention la plus probable, confirme si besoin   |
| Plusieurs résultats       | Liste tout et laisse l'utilisateur choisir                |
| Permission insuffisante   | Informe clairement, redirige vers l'admin                 |
| Liste vide                | Explique pourquoi et propose une action de création       |
| Données contradictoires   | Signale la contradiction, utilise la source la plus récente|
| Question générale non-app | Réponds brièvement, puis recentre sur CollabSearch        |
SYSTEM;
    }

    // =====================================================================
    // MOTEUR DE PARSING — Réponse enrichie
    // =====================================================================

    /**
     * Parse la réponse du LLM en extrayant reasoning, confidence, sources, advisor, response.
     */
    protected function parseEnhancedResponse(string $rawResponse): array
    {
        $result = [
            'reasoning'              => '',
            'response'               => $rawResponse,
            'confidence_score'       => 0.0,
            'sources'                => [],
            'advisor_insights'       => '',
            'is_clarification'       => false,
            'clarification_question' => null,
            'memory_notifications'   => [],
        ];

        // ── Extraire [REASONING] ──────────────────────────────────────────
        if (preg_match('/\[REASONING\](.*?)\[\/REASONING\]/s', $rawResponse, $m)) {
            $result['reasoning'] = trim($m[1]);
        }

        // ── Extraire [CONFIDENCE] ─────────────────────────────────────────
        if (preg_match('/\[CONFIDENCE\]\s*([\d.]+)\s*\[\/CONFIDENCE\]/s', $rawResponse, $m)) {
            $result['confidence_score'] = min(1.0, max(0.0, (float) $m[1]));
        }

        // ── Extraire [SOURCES] ────────────────────────────────────────────
        if (preg_match('/\[SOURCES\](.*?)\[\/SOURCES\]/s', $rawResponse, $m)) {
            $sourcesText = trim($m[1]);
            if (!empty($sourcesText) && $sourcesText !== '-') {
                $lines = array_filter(explode("\n", $sourcesText), fn($l) => !empty(trim($l)));
                foreach ($lines as $line) {
                    $line = trim(ltrim($line, '-'));
                    if (preg_match('/^(.+?)\s*:\s*(https?:\/\/.+)$/u', $line, $sm)) {
                        $result['sources'][] = ['title' => trim($sm[1]), 'url' => trim($sm[2])];
                    } elseif (!empty($line)) {
                        $result['sources'][] = ['title' => $line, 'url' => ''];
                    }
                }
            }
        }

        // ── Extraire [ADVISOR] ────────────────────────────────────────────
        if (preg_match('/\[ADVISOR\](.*?)\[\/ADVISOR\]/s', $rawResponse, $m)) {
            $result['advisor_insights'] = trim($m[1]);
        }

        // ── Extraire [CLARIFICATION] ──────────────────────────────────────
        if (preg_match('/\[CLARIFICATION\](.*?)\[\/CLARIFICATION\]/s', $rawResponse, $m)) {
            $clarif = trim($m[1]);
            if (!empty($clarif)) {
                $result['is_clarification'] = true;
                $result['clarification_question'] = $clarif;
            }
        }

        // ── Extraire [RESPONSE] ───────────────────────────────────────────
        if (preg_match('/\[RESPONSE\](.*?)\[\/RESPONSE\]/s', $rawResponse, $m)) {
            $result['response'] = trim($m[1]);
        } elseif (preg_match('/\[\/REASONING\](.*)/s', $rawResponse, $m)) {
            // Fallback: tout après [/REASONING]
            $remaining = $m[1];
            // Retirer les autres balises
            $remaining = preg_replace('/\[(?:CONFIDENCE|SOURCES|ADVISOR|CLARIFICATION)\].*?\[\/(?:CONFIDENCE|SOURCES|ADVISOR|CLARIFICATION)\]/s', '', $remaining);
            $result['response'] = trim($remaining);
        }

        // Nettoyer les balises orphelines
        $result['response'] = preg_replace('/\[\/?(?:RESPONSE|REASONING|CONFIDENCE|SOURCES|ADVISOR|CLARIFICATION)\]/', '', $result['response']);
        $result['response'] = trim($result['response']);

        // Fallback reasoning
        if (empty($result['reasoning'])) {
            $result['reasoning'] = $this->buildFallbackReasoning();
        }

        return $result;
    }

    /**
     * Raisonnement par défaut si le LLM ne produit pas de bloc [REASONING].
     */
    protected function buildFallbackReasoning(): string
    {
        return "Étape 1 (Comprendre) : Analyse de l'intention et détection de la demande.\n"
             . "Étape 2 (Objectif) : Formuler une réponse claire et structurée.\n"
             . "Étape 3 (Contraintes) : Respect du formatage Markdown et de la langue française.\n"
             . "Étape 4 (Contexte) : Analyse des données contextuelles et de la mémoire.\n"
             . "Étape 5 (Informations) : Recherche dans la base locale et sur le web.\n"
             . "Étape 6 (Vérification) : Cohérence des données vérifiée.\n"
             . "Étape 7 (Construction) : Structuration de la réponse.\n"
             . "Étape 8 (Auto-évaluation) : Contraintes respectées.\n"
             . "Étape 9 (Confiance) : Niveau de confiance estimé.\n"
             . "Étape 10 (Mémorisation) : Aucun élément critique à mémoriser.";
    }

    // =====================================================================
    // MOTEUR DE CONFIANCE — Calcul du score de confiance
    // =====================================================================

    /**
     * Calcule un score de confiance basé sur la qualité du contexte et de la réponse.
     */
    protected function calculateConfidence(
        string $question,
        string $response,
        string $contextString,
        string $localResults,
        string $webResults
    ): float {
        $score = 0.5; // Base

        // Bonus si des données locales pertinentes ont été trouvées
        if (!str_contains($localResults, 'Aucune correspondance')) {
            $score += 0.15;
        }

        // Bonus si la recherche web a produit des résultats
        if (!str_contains($webResults, 'Aucune réponse web') && !str_contains($webResults, 'désactivée')) {
            $score += 0.1;
        }

        // Bonus si le contexte projet est chargé
        if (str_contains($contextString, 'PROJET ACTIF')) {
            $score += 0.1;
        }

        // Bonus si la mémoire utilisateur est disponible
        if (str_contains($contextString, 'MÉMOIRE & PRÉFÉRENCES')) {
            $score += 0.05;
        }

        // Bonus si l'historique conversationnel est chargé
        if (str_contains($contextString, 'DERNIERS MESSAGES')) {
            $score += 0.05;
        }

        // Malus si la réponse est très courte
        if (mb_strlen($response) < 50) {
            $score -= 0.1;
        }

        // Bonus si la réponse est substantielle
        if (mb_strlen($response) > 300) {
            $score += 0.05;
        }

        return min(1.0, max(0.0, round($score, 2)));
    }

    // =====================================================================
    // MOTEUR CONSEILLER — Insights proactifs
    // =====================================================================

    /**
     * Génère des insights proactifs basés sur le contexte.
     */
    protected function buildAdvisorInsights(array $context, ?int $userId): string
    {
        $insights = [];

        // Vérifier les tâches en retard
        if (!empty($context['tasks'])) {
            $overdueTasks = [];
            foreach ($context['tasks'] as $task) {
                $status = $task['status'] ?? 'todo';
                if ($status instanceof \BackedEnum) {
                    $status = $status->value;
                }
                if (in_array($status, ['todo', 'in_progress'])) {
                    if (!empty($task['due_date']) && strtotime($task['due_date']) < time()) {
                        $overdueTasks[] = $task['title'] ?? 'Sans titre';
                    }
                }
            }
            if (!empty($overdueTasks)) {
                $insights[] = "⚠️ TÂCHES EN RETARD DÉTECTÉES : " . implode(', ', $overdueTasks);
            }
        }

        // Vérifier si des publications manquent d'analyse
        if (!empty($context['project_id'])) {
            try {
                $unanalyzed = \App\Models\Publication::where('project_id', $context['project_id'])
                    ->whereDoesntHave('analyses')
                    ->count();
                if ($unanalyzed > 0) {
                    $insights[] = "📊 {$unanalyzed} publication(s) dans ce projet n'ont pas encore été analysées par l'IA.";
                }
            } catch (\Exception $e) {
                // Silencieux
            }
        }

        return implode("\n", $insights);
    }

    // =====================================================================
    // MOTEUR DE MÉMORISATION — Apprentissage automatique
    // =====================================================================

    /**
     * Extrait automatiquement les informations mémorisables de l'échange.
     * Retourne les notifications de mémorisation à afficher à l'utilisateur.
     */
    protected function autoMemorize(int $userId, string $question, string $response, array $context): array
    {
        $notifications = [];
        $questionLower = mb_strtolower($question);

        // Détecter les préférences exprimées
        $preferencePatterns = [
            '/je préfère\s+(.{3,60})/iu'       => 'preference',
            '/j\'utilise\s+(.{3,60})/iu'        => 'technology',
            '/mon objectif est\s+(.{3,60})/iu'  => 'objective',
            '/nous avons décidé\s+(.{3,60})/iu' => 'decision',
            '/j\'ai choisi\s+(.{3,60})/iu'      => 'decision',
            '/on va utiliser\s+(.{3,60})/iu'     => 'technology',
            '/le framework est\s+(.{3,60})/iu'  => 'technology',
            '/notre stack\s+(.{3,60})/iu'        => 'technology',
        ];

        foreach ($preferencePatterns as $pattern => $category) {
            if (preg_match($pattern, $question, $matches)) {
                $value = trim($matches[1], ' .');
                $key = Str::slug(Str::limit($value, 50), '_');

                AiMemory::updateOrCreate(
                    ['user_id' => $userId, 'key' => $key],
                    ['value' => $value, 'category' => $category]
                );

                $emoji = match($category) {
                    'preference'  => '⚙️',
                    'technology'  => '💻',
                    'decision'    => '🏛️',
                    'objective'   => '🎯',
                    default       => '📝',
                };
                $notifications[] = "{$emoji} Mémorisé : \"{$value}\" ({$category})";
            }
        }

        return $notifications;
    }

    // =====================================================================
    // MOTEUR DE RÉSUMÉ GLISSANT — Mise à jour du contexte conversationnel
    // =====================================================================

    /**
     * Met à jour le résumé glissant de la conversation après chaque échange.
     */
    protected function updateConversationSummary(int $conversationId, string $question, string $response): void
    {
        try {
            $conversation = AiConversation::find($conversationId);
            if (!$conversation) return;

            $existingSummary = $conversation->context_summary ?? '';
            $responseSnippet = Str::limit($response, 200);
            $questionSnippet = Str::limit($question, 100);

            // Construire le nouveau résumé (condensé)
            $newEntry = "[Q: {$questionSnippet}] → [R: {$responseSnippet}]";

            if (empty($existingSummary)) {
                $updatedSummary = $newEntry;
            } else {
                // Limiter à ~2000 caractères pour ne pas exploser le contexte
                $combined = $existingSummary . "\n" . $newEntry;
                if (mb_strlen($combined) > 2000) {
                    // Garder les entrées les plus récentes
                    $entries = explode("\n", $combined);
                    while (mb_strlen(implode("\n", $entries)) > 2000 && count($entries) > 1) {
                        array_shift($entries);
                    }
                    $combined = implode("\n", $entries);
                }
                $updatedSummary = $combined;
            }

            // Extraire les sujets principaux
            $metadata = $conversation->context_metadata ?? [];
            $topics = $metadata['topics'] ?? [];
            $newTopics = $this->extractTopics($question);
            $topics = array_values(array_unique(array_merge($topics, $newTopics)));
            if (count($topics) > 15) {
                $topics = array_slice($topics, -15);
            }
            $metadata['topics'] = $topics;
            $metadata['last_question'] = $questionSnippet;
            $metadata['message_count'] = ($metadata['message_count'] ?? 0) + 2; // +1 user +1 assistant

            $conversation->update([
                'context_summary'  => $updatedSummary,
                'context_metadata' => $metadata,
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur mise à jour résumé conversation: " . $e->getMessage());
        }
    }

    /**
     * Extrait les sujets principaux d'une question.
     */
    protected function extractTopics(string $question): array
    {
        $topics = [];
        $topicKeywords = [
            'réunion' => 'Réunions', 'reunion' => 'Réunions', 'meeting' => 'Réunions',
            'tâche' => 'Tâches', 'tache' => 'Tâches', 'task' => 'Tâches',
            'projet' => 'Projets', 'project' => 'Projets',
            'publication' => 'Publications', 'article' => 'Publications', 'paper' => 'Publications',
            'budget' => 'Budget', 'coût' => 'Budget',
            'membre' => 'Équipe', 'équipe' => 'Équipe', 'chercheur' => 'Équipe',
            'calendrier' => 'Calendrier', 'planning' => 'Calendrier',
            'analyse' => 'Analyse', 'ia' => 'Intelligence Artificielle', 'ai' => 'Intelligence Artificielle',
        ];

        $questionLower = mb_strtolower($question);
        foreach ($topicKeywords as $keyword => $topic) {
            if (str_contains($questionLower, $keyword)) {
                $topics[] = $topic;
            }
        }

        return array_unique($topics);
    }

    // =====================================================================
    // MOTEUR DE RECHERCHE WEB INTELLIGENT — Structuré
    // =====================================================================

    /**
     * Détermine si la question nécessite une recherche web.
     * Étendu avec plus de triggers intelligents.
     */
    protected function shouldTriggerWebSearch(string $query): bool
    {
        $queryLower = mb_strtolower($query);

        // Ne pas chercher pour les salutations et commandes simples
        $skipPatterns = ['salut', 'bonjour', 'hello', 'merci', 'ciao', 'aide-moi', 'résume', 'continue', 'développe'];
        foreach ($skipPatterns as $skip) {
            if ($queryLower === $skip) return false;
        }

        $triggers = [
            // Actualités
            'actualité', 'nouvelle', 'news', 'dernier', 'dernière', 'récent',
            // Technologies
            'next.js', 'nextjs', 'laravel', 'react', 'vue.js', 'angular', 'python', 'node.js',
            'typescript', 'docker', 'kubernetes', 'aws', 'azure',
            // Documentation
            'mdn', 'doc', 'documentation', 'api', 'npm', 'composer', 'version', 'changelog',
            // Recherche scientifique
            'scientific', 'scholar', 'papier', 'paper', 'recherche', 'étude',
            // Comparatifs & tendances
            'tendance', 'trend', 'comparatif', 'benchmark', 'vs', 'versus',
            'meilleur', 'recommand', 'prix', 'tarif',
            // Réglementations
            'réglementation', 'loi', 'norme', 'rgpd', 'gdpr', 'conformité',
            // Mises à jour
            'mise à jour', 'update', 'upgrade', 'date de sortie', 'release',
            // Framework & outils
            'framework', 'bibliothèque', 'library', 'outil', 'tool', 'package',
        ];

        foreach ($triggers as $trigger) {
            if (str_contains($queryLower, $trigger)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Recherche web structurée retournant texte + sources.
     */
    public function searchWebStructured(string $query): array
    {
        $result = ['text' => '', 'sources' => []];

        if (empty(trim($query))) {
            $result['text'] = "Aucune recherche web spécifiée.";
            return $result;
        }

        // ── 1. Serper.dev (Google Search API gratuit — 2500 req/mois) ────────
        // Clé gratuite sur https://serper.dev
        if (!empty($this->serperKey)) {
            try {
                $response = Http::withoutVerifying()
                    ->withHeaders([
                        'X-API-KEY'    => $this->serperKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(8)
                    ->post('https://google.serper.dev/search', [
                        'q'   => $query,
                        'gl'  => 'fr',
                        'hl'  => 'fr',
                        'num' => 5,
                    ]);

                if ($response->successful()) {
                    $data    = $response->json();
                    $organics = $data['organic'] ?? [];
                    $texts   = [];
                    foreach (array_slice($organics, 0, 5) as $item) {
                        $title   = $item['title'] ?? 'Source';
                        $snippet = $item['snippet'] ?? '';
                        $url     = $item['link'] ?? '#';
                        if (!empty($snippet)) {
                            $texts[]           = "- **{$title}** : {$snippet}";
                            $result['sources'][] = ['title' => $title, 'url' => $url];
                        }
                    }
                    if (!empty($texts)) {
                        $result['text'] = implode("
", $texts);
                        return $result;
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Serper.dev error: " . $e->getMessage());
            }
        }

        // ── 2. Tavily (gratuit — 1000 req/mois, conçu pour l'IA) ─────────────
        // Clé gratuite sur https://app.tavily.com
        if (!empty($this->tavilyKey)) {
            try {
                $response = Http::withoutVerifying()
                    ->timeout(10)
                    ->post('https://api.tavily.com/search', [
                        'api_key'      => $this->tavilyKey,
                        'query'        => $query,
                        'max_results'  => 5,
                        'search_depth' => 'basic',
                        'include_answer' => true,
                    ]);

                if ($response->successful()) {
                    $data    = $response->json();
                    $texts   = [];
                    // Réponse directe de Tavily (synthèse)
                    if (!empty($data['answer'])) {
                        $texts[] = "💡 **Synthèse** : " . $data['answer'];
                    }
                    foreach ($data['results'] ?? [] as $item) {
                        $title   = $item['title'] ?? 'Source';
                        $snippet = $item['content'] ?? '';
                        $url     = $item['url'] ?? '#';
                        if (!empty($snippet)) {
                            $texts[]           = "- **{$title}** : " . Str::limit($snippet, 200);
                            $result['sources'][] = ['title' => $title, 'url' => $url];
                        }
                    }
                    if (!empty($texts)) {
                        $result['text'] = implode("
", $texts);
                        return $result;
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Tavily error: " . $e->getMessage());
            }
        }

        // ── 3. Fallback DuckDuckGo HTML (sans clé) ───────────────────────────
        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                ])
                ->timeout(5)
                ->get('https://html.duckduckgo.com/html/', ['q' => $query]);

            if ($response->successful()) {
                $html = $response->body();
                $dom  = new \DOMDocument();
                @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
                $xpath = new \DOMXPath($dom);

                $snippetsNodes = $xpath->query('//a[@class="result__snippet"]');
                $urlNodes      = $xpath->query('//a[@class="result__url"]');

                $texts = [];
                $count = min($snippetsNodes->length, 5);

                for ($i = 0; $i < $count; $i++) {
                    $snippet   = trim($snippetsNodes->item($i)->nodeValue);
                    $titleNode = $urlNodes->item($i);
                    $title     = $titleNode ? trim($titleNode->nodeValue) : 'Source Web';
                    $url       = $titleNode ? trim($titleNode->getAttribute('href')) : '#';

                    if (strpos($url, 'uddg=') !== false) {
                        $urlParts = parse_url($url);
                        if (isset($urlParts['query'])) {
                            parse_str($urlParts['query'], $queryParts);
                            if (isset($queryParts['uddg'])) {
                                $url = urldecode($queryParts['uddg']);
                            }
                        }
                    }

                    $texts[]           = "- **{$title}** : {$snippet}";
                    $result['sources'][] = ['title' => $title, 'url' => $url];
                }

                if (!empty($texts)) {
                    $result['text'] = implode("
", $texts);
                    return $result;
                }
            }
        } catch (\Exception $e) {
            Log::error("DuckDuckGo HTML search error: " . $e->getMessage());
        }

        // ── 4. DuckDuckGo Instant Answer API ─────────────────────────────────
        try {
            $response = Http::withoutVerifying()
                ->timeout(3)
                ->get('https://api.duckduckgo.com/', [
                    'q' => $query, 'format' => 'json', 'no_html' => 1, 'skip_disambig' => 1,
                ]);

            if ($response->successful()) {
                $data     = $response->json();
                $abstract = $data['AbstractText'] ?? '';
                if (!empty($abstract)) {
                    $result['text']      = "- [Réponse instantanée] : {$abstract}";
                    $result['sources'][] = ['title' => 'DuckDuckGo', 'url' => $data['AbstractURL'] ?? ''];
                    return $result;
                }
            }
        } catch (\Exception $e) {
            Log::error("DuckDuckGo Instant Answer error: " . $e->getMessage());
        }

        $result['text'] = "Aucune réponse web trouvée.";
        return $result;
    }

    // Alias pour backward compatibility
    public function searchWeb(string $query): string
    {
        return $this->searchWebStructured($query)['text'];
    }

    // =====================================================================
    // MOTEUR DE RECHERCHE LOCALE — Données CollabSearch avec filtres
    // =====================================================================

    /**
     * Recherche dans la base de données locale.
     * Filtre par utilisateur, statut et contrainte temporelle.
     */
    public function searchLocal(string $query, ?int $userId = null, ?int $projectId = null): string
    {
        if (empty(trim($query))) {
            return "Aucune recherche locale spécifiée.";
        }

        $results    = [];
        $queryLower = mb_strtolower($query);
        $authUserId = $userId ?? auth()->id();

        // Détecter l'intention de la question
        $wantsMeetings     = str_contains($queryLower, 'réunion') || str_contains($queryLower, 'reunion') || str_contains($queryLower, 'visio') || str_contains($queryLower, 'agenda') || str_contains($queryLower, 'calendrier');
        $wantsTasks        = str_contains($queryLower, 'tâche') || str_contains($queryLower, 'tache') || str_contains($queryLower, 'task') || str_contains($queryLower, 'à faire');
        $wantsPublications = str_contains($queryLower, 'publication') || str_contains($queryLower, 'article') || str_contains($queryLower, 'pdf') || str_contains($queryLower, 'papier');
        $wantsProjects     = str_contains($queryLower, 'projet') || str_contains($queryLower, 'project');
        $wantsMembers      = str_contains($queryLower, 'membre') || str_contains($queryLower, 'chercheur') || str_contains($queryLower, 'équipe') || str_contains($queryLower, 'equipe');
        $wantsAll          = !$wantsMeetings && !$wantsTasks && !$wantsPublications && !$wantsProjects && !$wantsMembers;

        // Contrainte temporelle (aujourd'hui, demain, semaine...)
        $dateConstraint   = $this->detectDateConstraint($queryLower);
        // Contrainte de statut (terminée, en cours, annulée, à venir...)
        $statusConstraint = $this->detectStatusConstraint($queryLower);

        // Détection "projet actuel/en cours/present"
        $wantsActiveProject = str_contains($queryLower, 'present') || str_contains($queryLower, 'présent')
            || str_contains($queryLower, 'actuel') || str_contains($queryLower, 'courant')
            || str_contains($queryLower, 'ce projet') || str_contains($queryLower, 'mon projet');

        try {
            // ── Projets ──────────────────────────────────────────────────────
            if ($wantsProjects || $wantsAll) {
                $projectQuery = \App\Models\Project::query();

                if ($projectId) {
                    // Projet lié à la conversation courante
                    $projectQuery->where('id', $projectId);
                } elseif ($authUserId) {
                    // Projets où l'utilisateur est membre
                    $projectQuery->whereHas('members', fn($q) => $q->where('users.id', $authUserId));
                }

                // Filtre statut "actif/en cours/présent"
                if ($wantsActiveProject || $statusConstraint === 'active') {
                    $projectQuery->whereIn('status', ['active', 'approved']);
                } elseif ($statusConstraint === 'past') {
                    $projectQuery->whereIn('status', ['archived', 'rejected']);
                }

                $projects = $projectQuery->take(5)->get();
                if ($projects->isEmpty()) {
                    $results[] = "[Projets] Aucun projet trouvé" . ($authUserId ? " pour votre compte" : "") . ".";
                } else {
                    foreach ($projects as $p) {
                        $pStatus   = $p->status?->value ?? '';
                        $results[] = "[Projet] \"{$p->title}\" (Statut: {$pStatus}, ID: {$p->id}) : " . \Illuminate\Support\Str::limit($p->description, 150);
                    }
                }
            }

            // ── Tâches ───────────────────────────────────────────────────────
            if ($wantsTasks || $wantsAll) {
                $taskQuery = \App\Models\Task::with(['assignee', 'project']);

                // Filtre utilisateur : tâches assignées à moi ou dans mon projet
                if ($authUserId) {
                    $taskQuery->where(function ($q) use ($authUserId, $projectId) {
                        $q->where('assignee_id', $authUserId);
                        if (!$projectId) {
                            $q->orWhereHas('project', fn($pq) => $pq->whereHas('members', fn($mq) => $mq->where('users.id', $authUserId)));
                        }
                    });
                }

                if ($projectId) {
                    $taskQuery->where('project_id', $projectId);
                }

                // Filtre de statut
                if ($statusConstraint === 'completed') {
                    $taskQuery->whereIn('status', ['validated', 'submitted']);
                } elseif ($statusConstraint === 'in_progress') {
                    $taskQuery->where('status', 'in_progress');
                } elseif ($statusConstraint === 'pending') {
                    $taskQuery->where('status', 'todo');
                }

                // Filtre date
                if ($dateConstraint === 'today')        $taskQuery->whereDate('due_date', today());
                elseif ($dateConstraint === 'tomorrow')  $taskQuery->whereDate('due_date', today()->addDay());
                elseif ($dateConstraint === 'this_week') $taskQuery->whereBetween('due_date', [now()->startOfWeek(), now()->endOfWeek()]);

                $tasks = $taskQuery->take(10)->get();
                if ($tasks->isEmpty()) {
                    $results[] = "[Tâches] Aucune tâche trouvée correspondant à votre recherche.";
                } else {
                    foreach ($tasks as $t) {
                        $tStatus   = $t->status instanceof \BackedEnum ? $t->status->value : $t->status;
                        $assignee  = $t->assignee?->full_name ?? 'Non assignée';
                        $project   = $t->project?->title ?? 'Aucun projet';
                        $results[] = "[Tâche] \"{$t->title}\" (Statut: {$tStatus}, Assigné: {$assignee}, Projet: {$project}, Échéance: " . ($t->due_date ?? 'N/A') . ")";
                    }
                }
            }

            // ── Publications ─────────────────────────────────────────────────
            if ($wantsPublications || $wantsAll) {
                $pubQuery = \App\Models\Publication::query();
                if ($projectId) {
                    $pubQuery->where('project_id', $projectId);
                } elseif ($authUserId) {
                    $pubQuery->where('created_by', $authUserId);
                }
                $pubs = $pubQuery->take(5)->get();
                foreach ($pubs as $pub) {
                    $pubType = $pub->type?->value ?? '';
                    $results[] = "[Publication] \"{$pub->title}\" (Type: {$pubType}, Année: {$pub->year}, Auteurs: {$pub->authors_list}) — Abstract: " . \Illuminate\Support\Str::limit($pub->abstract ?? '', 300);
                }
            }

            // ── Réunions — filtrage par statut + date + utilisateur ────────────
            if ($wantsMeetings || $wantsAll) {
                $meetingQuery = \App\Models\Meeting::with(['organizer', 'project']);

                // Filtre utilisateur : organisateur ou participant
                if ($authUserId) {
                    $meetingQuery->where(function ($q) use ($authUserId) {
                        $q->where('organizer_id', $authUserId)
                          ->orWhereHas('participants', fn($pq) => $pq->where('users.id', $authUserId));
                    });
                }

                // Filtre projet de la conversation courante
                if ($projectId) {
                    $meetingQuery->where('project_id', $projectId);
                }

                // Priorité 1 : contrainte de statut
                if ($statusConstraint === 'past') {
                    // Réunions terminées : status=completed OU date passée
                    $meetingQuery->where(function ($q) {
                        $q->where('status', 'completed')
                          ->orWhere(function ($q2) {
                              $q2->where('scheduled_at', '<', now())
                                 ->whereNotIn('status', ['cancelled']);
                          });
                    })->orderBy('scheduled_at', 'desc');
                    $periodLabel = "déjà terminées";
                } elseif ($statusConstraint === 'in_progress') {
                    $meetingQuery->where('status', 'in_progress')->orderBy('scheduled_at', 'desc');
                    $periodLabel = "en cours";
                } elseif ($statusConstraint === 'cancelled') {
                    $meetingQuery->where('status', 'cancelled')->orderBy('scheduled_at', 'desc');
                    $periodLabel = "annulées";
                } elseif ($statusConstraint === 'upcoming') {
                    $meetingQuery->whereIn('status', ['scheduled', 'in_progress'])
                                 ->where('scheduled_at', '>=', now())
                                 ->orderBy('scheduled_at', 'asc');
                    $periodLabel = "à venir";
                }
                // Priorité 2 : contrainte de date
                elseif ($dateConstraint === 'today') {
                    $meetingQuery->whereDate('scheduled_at', today())->orderBy('scheduled_at', 'asc');
                    $periodLabel = "aujourd'hui (" . now()->format('d/m/Y') . ")";
                } elseif ($dateConstraint === 'tomorrow') {
                    $meetingQuery->whereDate('scheduled_at', today()->addDay())->orderBy('scheduled_at', 'asc');
                    $periodLabel = "demain (" . now()->addDay()->format('d/m/Y') . ")";
                } elseif ($dateConstraint === 'this_week') {
                    $meetingQuery->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()])->orderBy('scheduled_at', 'asc');
                    $periodLabel = "cette semaine";
                } elseif ($dateConstraint === 'this_month') {
                    $meetingQuery->whereMonth('scheduled_at', now()->month)->whereYear('scheduled_at', now()->year)->orderBy('scheduled_at', 'asc');
                    $periodLabel = "ce mois-ci";
                }
                // Aucune contrainte : toutes les réunions (passées + à venir)
                else {
                    $meetingQuery->orderBy('scheduled_at', 'desc');
                    $periodLabel = "toutes";
                }

                $meetings = $meetingQuery->take(10)->get();

                if ($meetings->isEmpty()) {
                    $results[] = "[Réunions] Aucune réunion {$periodLabel} trouvée dans CollabSearch.";
                } else {
                    foreach ($meetings as $m) {
                        $dateStr    = $m->scheduled_at ? $m->scheduled_at->format('d/m/Y à H:i') : 'Date non définie';
                        $organizer  = $m->organizer?->full_name ?? 'Inconnu';
                        $mProject   = $m->project?->title;
                        $mStatus    = $m->status instanceof \BackedEnum ? $m->status->value : ($m->status ?? '');
                        $results[]  = "[Réunion] \"{$m->title}\" — {$dateStr} (Statut: {$mStatus})"
                            . ($mProject ? " (Projet: {$mProject})" : "")
                            . ", Organisateur: {$organizer}"
                            . ($m->description ? " — " . \Illuminate\Support\Str::limit($m->description, 100) : "");
                    }
                }
            }

            // ── Membres ──────────────────────────────────────────────────────
            if ($wantsMembers || $wantsAll) {
                $userQuery = \App\Models\User::query();
                if ($projectId) {
                    $userQuery->whereHas('projects', fn($q) => $q->where('projects.id', $projectId));
                }
                $users = $userQuery->take(10)->get();
                foreach ($users as $u) {
                    $results[] = "[Membre] {$u->full_name} ({$u->email})";
                }
            }

        } catch (\Exception $e) {
            Log::error("Erreur recherche locale: " . $e->getMessage());
        }

        if (empty($results)) {
            return "Aucune donnée pertinente trouvée dans l'application CollabSearch.";
        }

        return implode("\n", $results);
    }


    // =====================================================================
    // MOTEUR D'EXPORT — Conversations
    // =====================================================================

    /**
     * Exporte une conversation dans le format demandé.
     */
    public function exportConversation(int $conversationId, string $format = 'markdown'): array
    {
        $conversation = AiConversation::with('messages')->findOrFail($conversationId);
        $messages = $conversation->messages;

        $filename = Str::slug($conversation->title) . '_' . now()->format('Y-m-d');

        if ($format === 'json') {
            $content = json_encode([
                'title'      => $conversation->title,
                'created_at' => $conversation->created_at->toIso8601String(),
                'messages'   => $messages->map(fn($m) => [
                    'role'       => $m->role,
                    'content'    => $m->content,
                    'reasoning'  => $m->reasoning,
                    'confidence' => $m->confidence_score,
                    'sources'    => $m->sources,
                    'created_at' => $m->created_at->toIso8601String(),
                ])->toArray(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            return ['content' => $content, 'filename' => "{$filename}.json", 'mime' => 'application/json'];
        }

        // Markdown (par défaut — le plus lisible et universel)
        $md = "# {$conversation->title}\n";
        $md .= "_Exporté le " . now()->format('d/m/Y à H:i') . "_\n\n---\n\n";

        foreach ($messages as $msg) {
            $role = $msg->role === 'user' ? '👤 **Vous**' : '🤖 **Assistant IA**';
            $time = $msg->created_at->format('H:i');
            $md .= "### {$role} — {$time}\n\n";
            $md .= $msg->content . "\n\n";

            if ($msg->confidence_score) {
                $md .= "_Confiance : " . round($msg->confidence_score * 100) . "%_\n\n";
            }

            $md .= "---\n\n";
        }

        return ['content' => $md, 'filename' => "{$filename}.md", 'mime' => 'text/markdown'];
    }

    // =====================================================================
    // ANALYSE DE RÉUNION & PUBLICATION (inchangé)
    // =====================================================================

    public function analyzeMeeting(Meeting $meeting): array
    {
        $transcriptText = '';
        if ($meeting->transcript) {
            $transcriptText = $meeting->transcript->raw_transcript ?? $meeting->transcript->formatted_transcript ?? '';
        }
        if (empty($transcriptText)) {
            $transcriptText = $meeting->recording_transcript ?? $meeting->minutes ?? $meeting->description ?? 'Aucune transcription disponible.';
        }

        $prompt = "Vous êtes un assistant de recherche IA. Analysez la transcription de la réunion suivante :
Titre : {$meeting->title}
Date : " . ($meeting->scheduled_at ? $meeting->scheduled_at->toDateTimeString() : $meeting->date) . "
Description/Agenda : {$meeting->description}

Transcription :
\"\"\"
{$transcriptText}
\"\"\"

Vous devez générer un compte-rendu structuré de la réunion sous format JSON uniquement, contenant exactement ces clés :
{
  \"summary\": \"Résumé clair en 3 à 5 phrases du contenu de la réunion.\",
  \"key_decisions\": [\"Décision importante 1\", \"Décision importante 2\"],
  \"action_items\": [
    {\"task\": \"Description précise de la tâche\", \"assignee\": \"Nom du participant assigné ou 'Non assigné'\", \"deadline\": \"Date de rendu estimée ou 'Non spécifiée'\"}
  ],
  \"next_meeting_agenda\": [\"Point à aborder 1\", \"Point à aborder 2\"],
  \"participants_summary\": {\"present_names\": [\"Nom 1\", \"Nom 2\"], \"key_contributors\": [\"Nom 1\"]}
}
Répondez UNIQUEMENT avec le code JSON brut.";

        $responseString = $this->callLlm($prompt, "Vous êtes un assistant d'analyse de réunions scientifiques.");

        try {
            $jsonStart = strpos($responseString, '{');
            $jsonEnd = strrpos($responseString, '}');
            if ($jsonStart !== false && $jsonEnd !== false) {
                $responseString = substr($responseString, $jsonStart, $jsonEnd - $jsonStart + 1);
            }
            return json_decode($responseString, true) ?? [
                'summary' => $responseString, 'key_decisions' => [], 'action_items' => [],
                'next_meeting_agenda' => [], 'participants_summary' => []
            ];
        } catch (\Exception $e) {
            Log::error("Erreur de parsing JSON pour la réunion : " . $e->getMessage());
            return ['summary' => "Erreur d'analyse. Retour brut : " . $responseString, 'key_decisions' => [],
                'action_items' => [], 'next_meeting_agenda' => [], 'participants_summary' => []];
        }
    }

    public function analyzePublication(Publication $publication): array
    {
        // Toujours inclure les métadonnées comme ancre contextuelle
        $keywords   = is_array($publication->keywords)
            ? implode(', ', $publication->keywords)
            : ($publication->keywords ?? '');
        $metaBlock  = "Titre: {$publication->title}\n"
                    . "Auteurs: " . ($publication->authors_list ?? '') . "\n"
                    . "Année: " . ($publication->year ?? '') . "\n"
                    . "Abstract: " . ($publication->abstract ?? '') . "\n"
                    . "Mots-clés: {$keywords}";

        $pdfText = '';
        if ($publication->pdf_path) {
            try {
                $absolutePath = storage_path('app/public/' . $publication->pdf_path);
                if (!file_exists($absolutePath)) {
                    $absolutePath = storage_path('app/' . $publication->pdf_path);
                }
                if (file_exists($absolutePath)) {
                    $raw     = $this->extractTextFromPdf($absolutePath);
                    $pdfText = $this->cleanExtractedText($raw);
                }
            } catch (\Throwable $e) {
                Log::error("Erreur d'extraction de texte PDF : " . $e->getMessage());
            }
        }

        // Combiner : métadonnées + extrait PDF (limité à 6 000 caractères)
        if (!empty($pdfText) && mb_strlen($pdfText) >= 200) {
            $pdfExcerpt = mb_substr($pdfText, 0, 6000);
            $text = $metaBlock . "\n\n=== EXTRAIT DU CONTENU PDF ===\n" . $pdfExcerpt;
        } else {
            $text = $metaBlock;
        }

        // Limiter total
        $text = mb_substr($text, 0, 8000);

        // Extraire les valeurs simples avant l'interpolation heredoc
        $pubTitle   = $publication->title ?? '';
        $pubAuthors = $publication->authors_list ?? '';
        $pubYear    = $publication->year ?? '';
        $pubType    = $publication->type?->value ?? 'article';

        $prompt = <<<PROMPT
Tu es un expert en analyse de documents académiques et scientifiques.
Analyse le document décrit ci-dessous et génère une fiche d'analyse structurée.

IMPORTANT :
- Le document peut être un article de recherche, un rapport, un cours universitaire, un mémoire ou un support pédagogique.
- N'écris PAS le contenu brut du document dans tes réponses. Génère TES PROPRES phrases d'analyse.
- Si certaines informations ne sont pas explicites, déduis-les intelligemment à partir du contexte.

=== DOCUMENT ===
Titre     : {$pubTitle}
Auteurs   : {$pubAuthors}
Année     : {$pubYear}
Type      : {$pubType}

=== INFORMATIONS ET EXTRAIT ===
{$text}
=== FIN ===

Génère UNIQUEMENT le JSON suivant (sans markdown, sans backticks) :
{
  "abstract_summary": "Résumé rédigé par toi en 4 à 6 phrases claires. Explique : de quoi parle ce document, quel est son objectif, quels concepts ou sujets principaux il couvre, et à qui il s'adresse. Ne recopie pas le texte brut.",
  "research_domain": "Domaine principal (ex: Informatique – Bases de données, Génie logiciel, Biologie, Économie...)",
  "keywords": ["thème-clé-1", "thème-clé-2", "thème-clé-3", "thème-clé-4", "thème-clé-5"],
  "methodology": "Approche utilisée : cours magistral / recherche expérimentale / revue de littérature / étude de cas / mémoire... Détaille les outils, méthodes ou protocoles si identifiables.",
  "main_findings": [
    "Contenu/résultat/concept principal 1 présenté dans ce document",
    "Contenu/résultat/concept principal 2",
    "Contenu/résultat/concept principal 3"
  ],
  "strengths": [
    "Point fort 1 du document (pédagogie, rigueur, couverture du sujet...)",
    "Point fort 2"
  ],
  "weaknesses": [
    "Point faible 1 (manque d'exemples, absence de bibliographie, niveau trop avancé...)",
    "Point faible 2"
  ],
  "contribution": "En 2 phrases : quelle est la valeur ajoutée de ce document ? Qu'apporte-t-il au lecteur ou au domaine ?",
  "limitations": [
    "Limite 1 (scope, contexte, date, profondeur...)",
    "Limite 2"
  ],
  "future_work": "Ce que ce document suggère comme prochaine étape ou approfondissement possible.",
  "target_audience": "À qui ce document s'adresse principalement (étudiants, chercheurs, praticiens, niveau...).",
  "relevance_score": 6.5,
  "related_publications": [
    "Auteur (Année). Titre d'un document académique connexe pertinent. Éditeur/Journal.",
    "Auteur (Année). Titre d'un second document lié."
  ],
  "suggested_citations": [
    "Auteur(s) (Année). {$pubTitle}. [Type de document]. Institution/Éditeur."
  ]
}

RÈGLES :
- Réponds UNIQUEMENT avec le JSON brut.
- Toutes les listes doivent avoir au moins 1 élément non vide.
- relevance_score est un nombre décimal entre 1.0 et 10.0.
- Langue de sortie : FRANÇAIS exclusivement.
PROMPT;

        $responseString = $this->callLlm($prompt, "Tu es un expert en analyse bibliographique et en recherche scientifique. Tu analyses des publications avec rigueur et précision.");

        $defaultResult = [
            'abstract_summary'    => 'Analyse non disponible.',
            'research_domain'     => 'Inconnu',
            'keywords'            => [],
            'methodology'         => 'Non identifiée.',
            'main_findings'       => [],
            'strengths'           => [],
            'weaknesses'          => [],
            'contribution'        => 'Non déterminée.',
            'limitations'         => [],
            'future_work'         => 'Non spécifié.',
            'target_audience'     => 'Chercheurs académiques.',
            'relevance_score'     => 0.0,
            'related_publications'=> [],
            'suggested_citations' => [],
        ];

        try {
            $jsonStart = strpos($responseString, '{');
            $jsonEnd   = strrpos($responseString, '}');
            if ($jsonStart !== false && $jsonEnd !== false) {
                $responseString = substr($responseString, $jsonStart, $jsonEnd - $jsonStart + 1);
            }
            $decoded = json_decode($responseString, true);
            return is_array($decoded) ? array_merge($defaultResult, $decoded) : $defaultResult;
        } catch (\Exception $e) {
            Log::error("Erreur de parsing JSON pour la publication : " . $e->getMessage());
            return $defaultResult;
        }
    }

    /**
     * Nettoie le texte extrait d'un PDF : supprime les répétitions excessives,
     * les caractères parasites et normalise les espaces.
     */
    private function cleanExtractedText(string $text): string
    {
        if (empty($text)) return '';

        // Supprimer les caractères de contrôle (sauf \n, \t)
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // Couper dès qu'une section Q&R / dialogue interactif est détectée
        $cutPatterns = [
            '/Analysez\s+le\s+contenu\s+de\s+ce\s+document/iu',
            '/R\x{00e9}pondez\s+\x{00e0}\s+ces\s+questions/iu',
            '/Voici\s+une\s+r\x{00e9}ponse\s+possible/iu',
            '/esp\x{00e8}re\s+que\s+ces\s+r\x{00e9}ponses/iu',
            '/Je\s+vous\s+remercie\s+pour\s+votre\s+analyse/iu',
        ];
        foreach ($cutPatterns as $pattern) {
            if (preg_match($pattern, $text, $m, PREG_OFFSET_CAPTURE)) {
                $text = mb_substr($text, 0, $m[0][1]);
            }
        }

        // Normaliser les espaces multiples
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{4,}/', "\n\n", $text);

        // Dédupliquer les lignes répétées — 1 occurrence max
        $lines  = explode("\n", $text);
        $seen   = [];
        $unique = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                $unique[] = '';
                continue;
            }
            $key = mb_strtolower($trimmed);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[]   = $line;
            }
            // Toutes les répétitions supprimées
        }
        $text = implode("\n", $unique);

        // Supprimer les mots/phrases répétés en boucle sur la même ligne
        $text = preg_replace_callback('/(.{10,80}?)(\s+\1){2,}/u', fn($m) => $m[1], $text);

        // Supprimer les séquences de mots identiques répétés (ex: "SGBD SGBD SGBD…")
        $text = preg_replace('/(\b\S{3,}\b)(\s+\1){3,}/u', '$1', $text);

        return trim($text);
    }

    // =====================================================================
    // UTILITAIRES — PDF, Audio, LLM
    // =====================================================================

    public function extractTextFromPdf(string $pdfPath): string
    {
        if (!file_exists($pdfPath)) return '';
        try {
            $parserClass = 'Smalot\\PdfParser\\Parser';
            if (!class_exists($parserClass)) {
                Log::warning("smalot/pdfparser non disponible — extraction PDF ignorée.");
                return '';
            }
            $parser = new $parserClass();
            $pdf    = $parser->parseFile($pdfPath);
            return $pdf->getText();
        } catch (\Throwable $e) {
            Log::error("PDFParser error: " . $e->getMessage());
            return '';
        }
    }

    public function transcribeAudio(string $audioPath): string
    {
        if ($this->provider === 'openai' && !empty($this->openaiKey)) {
            try {
                $response = Http::withoutVerifying()
                    ->withToken($this->openaiKey)
                    ->attach('file', file_get_contents($audioPath), basename($audioPath))
                    ->post('https://api.openai.com/v1/audio/transcriptions', [
                        'model' => 'whisper-1', 'language' => 'fr',
                    ]);
                if ($response->successful()) {
                    return $response->json('text') ?? '';
                }
                Log::error("OpenAI Whisper transcription error: " . $response->body());
            } catch (\Exception $e) {
                Log::error("Whisper error: " . $e->getMessage());
            }
        }
        return "Simulation de transcription textuelle pour la visioconférence.";
    }

    // =====================================================================
    // MOTEUR LLM — Appels multi-providers
    // =====================================================================

    protected function callLlm(string $prompt, string $systemPrompt): string
    {
        $hasClaude = !empty($this->claudeKey) && !str_contains($this->claudeKey, 'dummy');
        $hasOpenAi = !empty($this->openaiKey) && !str_contains($this->openaiKey, 'dummy');
        $hasGroq   = !empty($this->groqKey)   && strlen($this->groqKey) > 10;
        $hasGemini = !empty($this->geminiKey) && strlen($this->geminiKey) > 10;

        // Respecter le provider explicitement choisi
        if ($this->provider === 'groq'   && $hasGroq)   return $this->callGroq($prompt, $systemPrompt);
        if ($this->provider === 'gemini' && $hasGemini) return $this->callGemini($prompt, $systemPrompt);
        if ($this->provider === 'openai' && $hasOpenAi) return $this->callOpenAi($prompt, $systemPrompt);
        if ($this->provider === 'claude' && $hasClaude) return $this->callClaude($prompt, $systemPrompt);
        if ($this->provider === 'ollama')               return $this->callOllama($prompt, $systemPrompt);

        // Cascade automatique gratuite : Groq → Claude → Gemini → OpenAI → Ollama → mock
        if ($hasGroq)   return $this->callGroq($prompt, $systemPrompt);
        if ($hasClaude) return $this->callClaude($prompt, $systemPrompt);
        if ($hasGemini) return $this->callGemini($prompt, $systemPrompt);
        if ($hasOpenAi) return $this->callOpenAi($prompt, $systemPrompt);

        Log::warning("AI service mock fallback - aucune clé API configurée. Provider: {$this->provider}");
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

    protected function callClaude(string $prompt, string $systemPrompt): string
    {
        try {
            $response = Http::withoutVerifying()->withHeaders([
                'x-api-key' => $this->claudeKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model' => 'claude-sonnet-4-20250514',
                'max_tokens' => $this->maxTokens,
                'temperature' => $this->temperature,
                'system' => $systemPrompt,
                'messages' => [['role' => 'user', 'content' => $prompt]],
            ]);

            if ($response->successful()) {
                $content = $response->json('content');
                if (is_array($content) && isset($content[0]['text'])) {
                    return $content[0]['text'];
                }
            }
            Log::error("Claude API call failed: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Claude exception: " . $e->getMessage());
        }
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

    protected function callOpenAi(string $prompt, string $systemPrompt): string
    {
        try {
            $response = Http::withoutVerifying()
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => $this->maxTokens,
                    'temperature' => $this->temperature,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content') ?? '';
            }
            Log::error("OpenAI API call failed: " . $response->body());
        } catch (\Exception $e) {
            Log::error("OpenAI exception: " . $e->getMessage());
        }
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

    // =====================================================================
    // PROVIDER GRATUIT — Groq (llama-3.3-70b-versatile, 14 400 req/jour)
    // Obtenir une clé gratuite sur https://console.groq.com
    // =====================================================================

    protected function callGroq(string $prompt, string $systemPrompt): string
    {
        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->groqKey,
                    'Content-Type'  => 'application/json',
                ])
                ->timeout(30)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model'       => 'llama-3.3-70b-versatile',
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'max_tokens'  => min($this->maxTokens, 8192),
                    'temperature' => $this->temperature,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                if (!empty($text)) return $text;
            }
            Log::error("Groq API error ({$response->status()}): " . $response->body());
        } catch (\Exception $e) {
            Log::error("Groq exception: " . $e->getMessage());
        }
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

    // =====================================================================
    // PROVIDER GRATUIT — Google Gemini 1.5 Flash (15 req/min, 1500/jour)
    // Obtenir une clé gratuite sur https://aistudio.google.com
    // =====================================================================

    protected function callGemini(string $prompt, string $systemPrompt): string
    {
        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$this->geminiKey}";
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->post($url, [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]],
                    ],
                    'contents' => [
                        ['role' => 'user', 'parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'maxOutputTokens' => min($this->maxTokens, 8192),
                        'temperature'     => $this->temperature,
                    ],
                ]);

            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text');
                if (!empty($text)) return $text;
            }
            Log::error("Gemini API error ({$response->status()}): " . $response->body());
        } catch (\Exception $e) {
            Log::error("Gemini exception: " . $e->getMessage());
        }
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

        protected function callOllama(string $prompt, string $systemPrompt): string
    {
        try {
            $response = Http::withoutVerifying()
                ->post("{$this->ollamaHost}/api/chat", [
                    'model' => $this->ollamaModel,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'stream' => false,
                    'options' => ['temperature' => $this->temperature],
                ]);

            if ($response->successful()) {
                return $response->json('message.content') ?? '';
            }
            Log::error("Ollama call failed: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Ollama exception: " . $e->getMessage());
        }
        return $this->mockLlmResponse($prompt, $systemPrompt);
    }

    // =====================================================================
    // MOCK LLM — Fallback sans API
    // =====================================================================

    protected function mockLlmResponse(string $prompt, string $systemPrompt = ''): string
    {
        // 1. Meeting analysis (returns raw JSON)
        if (strpos($prompt, 'participants_summary') !== false) {
            return json_encode([
                "summary" => "Cette réunion a permis d'aligner l'équipe sur les objectifs du sprint de recherche.",
                "key_decisions" => ["Adopter Claude Sonnet comme fournisseur IA par défaut.", "Déployer le bouton rejoindre dans la vue calendrier."],
                "action_items" => [
                    ["task" => "Créer les tables de migration Laravel pour l'IA", "assignee" => "Developer", "deadline" => date('Y-m-d', strtotime('+3 days'))],
                    ["task" => "Implémenter les composants Next.js pour le chat", "assignee" => "Front dev", "deadline" => date('Y-m-d', strtotime('+7 days'))]
                ],
                "next_meeting_agenda" => ["Review de l'intégration finale de l'IA", "Ajustement des prompts"],
                "participants_summary" => ["present_names" => ["Jean Dupont", "Marie Curie"], "key_contributors" => ["Jean Dupont"]]
            ], JSON_PRETTY_PRINT);
        }

        // 2. Publication analysis (returns raw JSON)
        if (strpos($prompt, 'abstract_summary') !== false) {
            return json_encode([
                "abstract_summary" => "Cet article propose une nouvelle architecture de réseau de neurones profond.",
                "keywords" => ["Deep Learning", "NLP", "IA scientifique"],
                "methodology" => "Réseau de neurones convolutif hybride avec attention.",
                "main_findings" => ["L'attention spatio-temporelle améliore l'analyse.", "F1-score de 0.94."],
                "research_domain" => "Intelligence Artificielle / NLP",
                "relevance_score" => 8.8,
                "related_publications" => ["Attention Is All You Need (2017)"],
                "suggested_citations" => ["Dupont, J. (2026). DeepDocAnalysis. Journal of CS, 12(3)."]
            ], JSON_PRETTY_PRINT);
        }

        // 3. Chatbot — Mock enrichi avec le format 10 étapes
        $question = trim(mb_strtolower($prompt));
        $intent = $this->detectMockIntent($question);

        $reasoning = $this->buildMockReasoning($intent, $question);
        $responseBody = $this->buildMockResponseBody($intent, $question, $systemPrompt);
        $confidence = $this->calculateMockConfidence($intent, $systemPrompt);

        return "[REASONING]\n{$reasoning}\n[/REASONING]\n\n"
             . "[CONFIDENCE]{$confidence}[/CONFIDENCE]\n\n"
             . "[SOURCES]\n[/SOURCES]\n\n"
             . "[ADVISOR]\n[/ADVISOR]\n\n"
             . "[RESPONSE]\n{$responseBody}\n[/RESPONSE]";
    }

    protected function detectMockIntent(string $question): string
    {
        // ── D'abord : est-ce une question de SAVOIR (conceptuelle) ? ──────
        // Si la question demande "comment", "pourquoi", "qu'est-ce que", "explique",
        // "conseille", "aide-moi à", c'est une question de connaissance, PAS une requête DB.
        $knowledgePatterns = [
            'comment ', 'pourquoi ', "qu'est-ce qu", 'explique', 'aide-moi',
            'conseille', 'quelle est la différence', 'quel est le meilleur',
            'quelles sont les meilleures', 'quelles sont les bonnes',
            'comment rédiger', 'comment faire', 'comment organiser',
            'comment structurer', 'comment améliorer', 'comment gérer',
            'comment créer', 'comment analyser', 'donne-moi des conseils',
            'c\'est quoi', 'définition', 'méthode pour', 'étapes pour',
            'guide pour', 'tutoriel', 'best practice', 'bonne pratique',
        ];
        foreach ($knowledgePatterns as $pattern) {
            if (str_contains($question, $pattern)) {
                return 'connaissance';
            }
        }

        // ── Ensuite : requêtes vers les données de l'application ──────────
        if (str_contains($question, 'réunion') || str_contains($question, 'reunion') || str_contains($question, 'visio') || str_contains($question, 'agenda') || str_contains($question, 'calendrier')) {
            return 'réunions';
        }
        if (str_contains($question, 'tâche') || str_contains($question, 'tache') || str_contains($question, 'task') || str_contains($question, 'todo') || str_contains($question, 'à faire')) {
            return 'tâches';
        }
        if (str_contains($question, 'projet') || str_contains($question, 'project')) {
            return 'projets';
        }
        if (str_contains($question, 'membre') || str_contains($question, 'chercheur') || str_contains($question, 'équipe') || str_contains($question, 'qui travaille')) {
            return 'membres';
        }
        if (str_contains($question, 'publication') || str_contains($question, 'article') || str_contains($question, 'pdf')) {
            return 'publications';
        }
        return 'général';
    }

    /**
     * Détecte les contraintes temporelles dans une question.
     */
    protected function detectDateConstraint(string $question): ?string
    {
        if (str_contains($question, "aujourd'hui") || str_contains($question, 'aujourd') || str_contains($question, 'ce jour') || str_contains($question, 'today')) {
            return 'today';
        }
        if (str_contains($question, 'demain') || str_contains($question, 'tomorrow')) {
            return 'tomorrow';
        }
        if (str_contains($question, 'cette semaine') || str_contains($question, 'semaine en cours') || str_contains($question, 'this week')) {
            return 'this_week';
        }
        if (str_contains($question, 'ce mois') || str_contains($question, 'mois en cours')) {
            return 'this_month';
        }
        return null;
    }

    /**
     * Détecte la contrainte de statut (terminé, en cours, annulé, à venir...).
     */
    protected function detectStatusConstraint(string $question): ?string
    {
        // Passé / terminé / fini
        if (str_contains($question, 'terminé') || str_contains($question, 'termine')
            || str_contains($question, 'terminée') || str_contains($question, 'terminee')
            || str_contains($question, 'passé') || str_contains($question, 'passe')
            || str_contains($question, 'passée') || str_contains($question, 'passee')
            || str_contains($question, 'déjà') || str_contains($question, 'deja')
            || str_contains($question, 'fini') || str_contains($question, 'finie')
            || str_contains($question, 'completed') || str_contains($question, 'ended')) {
            return 'past';
        }
        // Annulé
        if (str_contains($question, 'annulé') || str_contains($question, 'annule')
            || str_contains($question, 'annulée') || str_contains($question, 'annulee')
            || str_contains($question, 'cancelled') || str_contains($question, 'canceled')) {
            return 'cancelled';
        }
        // À venir / planifié
        if (str_contains($question, 'à venir') || str_contains($question, 'a venir')
            || str_contains($question, 'prochaine') || str_contains($question, 'prochain')
            || str_contains($question, 'upcoming') || str_contains($question, 'planifié')
            || str_contains($question, 'planifiée') || str_contains($question, 'scheduled')) {
            return 'upcoming';
        }
        // En cours
        if (str_contains($question, 'en cours') || str_contains($question, 'en train')
            || str_contains($question, 'in_progress') || str_contains($question, 'in progress')) {
            return 'in_progress';
        }
        // Actif (pour les projets)
        if (str_contains($question, 'actif') || str_contains($question, 'active')
            || str_contains($question, 'approuvé') || str_contains($question, 'approuve')) {
            return 'active';
        }
        return null;
    }

    /**
     * Détecte les contraintes numériques dans une question.
     */
    protected function detectNumericConstraint(string $question): ?int
    {
        if (preg_match('/(?:les|le|la|donne[- ]moi|montre[- ]moi|affiche)?\s*(\d+)\s*(?:plus|premier|dernièr|important|urgent|récent)/u', $question, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/(?:top|les)\s*(\d+)/u', $question, $m)) {
            return (int) $m[1];
        }
        return null;
    }

    protected function buildMockReasoning(string $intent, string $question = ''): string
    {
        $dateConstraint = $this->detectDateConstraint($question);
        $numConstraint = $this->detectNumericConstraint($question);

        $constraintText = "Format Markdown, langue française.";
        if ($dateConstraint) {
            $constraintText .= " Contrainte temporelle détectée : " . match($dateConstraint) {
                'today' => "aujourd'hui uniquement",
                'tomorrow' => "demain uniquement",
                'this_week' => "cette semaine",
                'this_month' => "ce mois-ci",
                default => $dateConstraint
            } . ".";
        }
        if ($numConstraint) {
            $constraintText .= " Contrainte numérique : exactement {$numConstraint} éléments.";
        }

        $objectifText = match($intent) {
            'connaissance' => "Fournir une explication détaillée, structurée et experte sur le sujet demandé.",
            'réunions' => "Lister les réunions correspondant aux critères spécifiés.",
            'tâches' => "Lister les tâches correspondant aux critères spécifiés.",
            'projets' => "Lister les projets depuis la base de données.",
            'membres' => "Lister les membres de l'équipe.",
            'publications' => "Lister les publications scientifiques.",
            default => "Comprendre et répondre au mieux à la demande de l'utilisateur."
        };

        return "Étape 1 (Comprendre) : L'utilisateur pose une question sur le thème : {$intent}.\n"
             . "Étape 2 (Objectif) : {$objectifText}\n"
             . "Étape 3 (Contraintes) : {$constraintText}\n"
             . "Étape 4 (Contexte) : Analyse de la mémoire utilisateur et de l'historique conversationnel.\n"
             . "Étape 5 (Informations) : Recherche dans la base de données locale et les connaissances internes.\n"
             . "Étape 6 (Vérification) : Données vérifiées et cohérentes.\n"
             . "Étape 7 (Construction) : Structuration de la réponse en respectant les contraintes.\n"
             . "Étape 8 (Auto-évaluation) : Vérification que toutes les contraintes sont respectées.\n"
             . "Étape 9 (Confiance) : Niveau de confiance évalué selon les données disponibles.\n"
             . "Étape 10 (Mémorisation) : Sujet et préférences notés pour le futur.";
    }

    protected function buildMockResponseBody(string $intent, string $question, string $systemPrompt): string
    {
        $dateConstraint = $this->detectDateConstraint($question);
        $numConstraint = $this->detectNumericConstraint($question);

        // ═══════════════════════════════════════════════════════════════════
        // RÉUNIONS — avec filtrage par date
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'réunions') {
            $query = \App\Models\Meeting::with(['organizer', 'project'])->orderBy('scheduled_at', 'asc');

            if ($dateConstraint === 'today') {
                $query->whereDate('scheduled_at', today());
            } elseif ($dateConstraint === 'tomorrow') {
                $query->whereDate('scheduled_at', today()->addDay());
            } elseif ($dateConstraint === 'this_week') {
                $query->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($dateConstraint === 'this_month') {
                $query->whereMonth('scheduled_at', now()->month)->whereYear('scheduled_at', now()->year);
            }

            if ($numConstraint) {
                $query->take($numConstraint);
            }

            $meetings = $query->get();

            $periodLabel = match($dateConstraint) {
                'today' => "aujourd'hui (" . now()->format('d/m/Y') . ")",
                'tomorrow' => "demain (" . now()->addDay()->format('d/m/Y') . ")",
                'this_week' => "cette semaine",
                'this_month' => "ce mois-ci",
                default => "planifiées"
            };

            if ($meetings->isEmpty()) {
                return "📅 Vous n'avez **aucune réunion** {$periodLabel} dans CollabSearch.\n\n💡 **Conseil** : Vous pouvez planifier une nouvelle réunion depuis l'onglet Calendrier.";
            }

            $body = "📅 **Vos réunions {$periodLabel} :**\n\n";
            foreach ($meetings as $m) {
                $dateStr = $m->scheduled_at ? $m->scheduled_at->format('d/m/Y à H:i') : 'Date non définie';
                $organizer = $m->organizer ? $m->organizer->full_name : 'Inconnu';
                $project = $m->project ? $m->project->title : null;
                $body .= "- **{$m->title}** — {$dateStr}\n";
                $body .= "  - 👤 Organisateur : {$organizer}\n";
                if ($project) $body .= "  - 📁 Projet : {$project}\n";
                if ($m->description) $body .= "  - 📝 " . Str::limit($m->description, 100) . "\n";
                if ($m->meeting_url) $body .= "  - 🔗 [Rejoindre la visioconférence](/meetings/{$m->id}/room)\n";
                $body .= "\n";
            }
            $body .= "---\n📊 **Total : {$meetings->count()} réunion(s)** {$periodLabel}";
            return $body;
        }

        // ═══════════════════════════════════════════════════════════════════
        // TÂCHES — avec filtrage
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'tâches') {
            $query = \App\Models\Task::with(['project', 'assignee']);

            // Détecter si on demande les tâches urgentes / en retard
            if (str_contains($question, 'urgent') || str_contains($question, 'retard') || str_contains($question, 'en retard')) {
                $query->where('status', '!=', 'completed')
                      ->where(function($q) {
                          $q->whereDate('due_date', '<', today())
                            ->orWhereNull('due_date');
                      });
            } elseif (str_contains($question, 'en cours') || str_contains($question, 'actif') || str_contains($question, 'active')) {
                $query->whereIn('status', ['todo', 'in_progress']);
            }

            if ($numConstraint) $query->take($numConstraint);

            $tasks = $query->get();
            if ($tasks->isEmpty()) return "📝 Aucune tâche ne correspond à vos critères.";

            $body = "📝 **Vos tâches dans CollabSearch :**\n\n";
            foreach ($tasks as $t) {
                $status = $t->status;
                if ($status instanceof \BackedEnum) $status = $status->value;
                $badge = match($status) { 'todo' => 'À faire ⏳', 'in_progress' => 'En cours ⚙️', 'review' => 'En révision 👀', 'completed' => 'Terminée ✅', default => $status };
                $assignee = $t->assignee ? $t->assignee->full_name : 'Non assignée';
                $project = $t->project ? $t->project->title : 'Aucun projet';
                $body .= "- **{$t->title}** — {$badge}\n";
                $body .= "  - 👤 Assigné à : {$assignee}\n";
                $body .= "  - 📁 Projet : {$project}\n";
                if ($t->due_date) {
                    $isOverdue = strtotime($t->due_date) < time() && $status !== 'completed';
                    $body .= "  - 📅 Échéance : " . date('d/m/Y', strtotime($t->due_date)) . ($isOverdue ? ' ⚠️ **EN RETARD**' : '') . "\n";
                }
                $body .= "\n";
            }
            $body .= "---\n📊 **Total : {$tasks->count()} tâche(s)**";
            return $body;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PROJETS — données DB
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'projets') {
            $projects = \App\Models\Project::with(['members', 'tasks'])->get();
            if ($projects->isEmpty()) return "📁 Aucun projet enregistré dans CollabSearch.";

            $body = "📁 **Projets CollabSearch :**\n\n";
            foreach ($projects as $p) {
                $status = $p->status;
                if ($status instanceof \BackedEnum) $status = $status->value;
                $statusBadge = match($status) {
                    'draft' => 'Brouillon 📝',
                    'submitted' => 'Soumis 📩',
                    'approved' => 'En cours 🟢',
                    'rejected' => 'Rejeté 🔴',
                    'archived' => 'Archivé 🗄️',
                    default => $status
                };
                $members = $p->members->pluck('full_name')->implode(', ') ?: 'Aucun membre';
                $taskCount = $p->tasks->count();
                $body .= "### {$p->title}\n";
                $body .= "- **Statut** : {$statusBadge}\n";
                $body .= "- **Membres** : {$members}\n";
                $body .= "- **Tâches** : {$taskCount} tâche(s)\n";
                if ($p->description) $body .= "- **Description** : " . Str::limit($p->description, 150) . "\n";
                $body .= "\n";
            }
            return $body;
        }

        // ═══════════════════════════════════════════════════════════════════
        // MEMBRES
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'membres') {
            $users = \App\Models\User::all();
            if ($users->isEmpty()) return "👥 Aucun membre inscrit.";

            $body = "👥 **Membres de la plateforme CollabSearch :**\n\n";
            foreach ($users as $u) {
                $body .= "- **{$u->full_name}** — {$u->email}\n";
            }
            $body .= "\n📊 **Total : {$users->count()} membre(s)**";
            return $body;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PUBLICATIONS
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'publications') {
            $pubs = \App\Models\Publication::all();
            if ($pubs->isEmpty()) return "📚 Aucune publication enregistrée.";

            $body = "📚 **Publications scientifiques :**\n\n";
            foreach ($pubs as $pub) {
                $body .= "### {$pub->title} ({$pub->year})\n";
                $body .= "- **Auteurs** : {$pub->authors_list}\n";
                if ($pub->journal) $body .= "- **Journal** : {$pub->journal}\n";
                if ($pub->abstract) $body .= "- **Résumé** : " . Str::limit($pub->abstract, 200) . "\n";
                $body .= "\n";
            }
            return $body;
        }

        // ═══════════════════════════════════════════════════════════════════
        // CONNAISSANCE — Réponses intelligentes pour les questions générales
        // ═══════════════════════════════════════════════════════════════════
        if ($intent === 'connaissance') {
            return $this->generateKnowledgeResponse($question);
        }

        // ═══════════════════════════════════════════════════════════════════
        // GÉNÉRAL — Salutations et fallback intelligent
        // ═══════════════════════════════════════════════════════════════════
        if (str_contains($question, 'salut') || str_contains($question, 'bonjour') || str_contains($question, 'hello')) {
            return "Bonjour ! 👋 Je suis l'assistant IA de CollabSearch.\n\nJe suis équipé d'un **pipeline de raisonnement en 10 étapes** et d'un **mode conseiller** pour vous aider de façon intelligente.\n\nJe peux vous aider à :\n- 📅 Gérer vos **réunions** (\"Quelles sont mes réunions aujourd'hui ?\")\n- 📝 Suivre vos **tâches** (\"Mes tâches urgentes\")\n- 📁 Analyser vos **projets** (\"Résume mon projet\")\n- 📚 Résumer vos **publications** scientifiques\n- 🌐 Rechercher sur le **web** des informations actuelles\n- 🧠 Répondre à vos **questions de recherche** (\"Comment rédiger une méthodologie ?\")\n\nPosez-moi une question !";
        }

        if (str_contains($question, 'merci') || str_contains($question, 'super') || str_contains($question, 'parfait')) {
            return "Je vous en prie ! 😊 N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider dans vos recherches et votre organisation.";
        }

        // Check web/local results in systemPrompt
        if (!empty($systemPrompt) && str_contains($systemPrompt, 'RÉSULTATS DE RECHERCHE SUR LE WEB')) {
            $parts = explode('--- RÉSULTATS DE RECHERCHE SUR LE WEB ---', $systemPrompt);
            if (count($parts) > 1) {
                $webSection = trim(explode('---', $parts[1])[0] ?? '');
                if (!empty($webSection) && !str_contains($webSection, 'Aucune réponse web') && !str_contains($webSection, 'désactivée')) {
                    return "🌐 **D'après mes recherches sur le web :**\n\n{$webSection}\n\n---\n_Source : DuckDuckGo_";
                }
            }
        }

        // Fallback intelligent — essayer de donner une réponse utile
        return $this->generateKnowledgeResponse($question);
    }

    /**
     * Génère des réponses de connaissance structurées pour les questions conceptuelles.
     * Simule un vrai LLM en utilisant des templates de réponses intelligentes.
     */
    protected function generateKnowledgeResponse(string $question): string
    {
        // ── Méthodologie de recherche ─────────────────────────────────────
        if (str_contains($question, 'méthodologie') || str_contains($question, 'methodologie')) {
            return "## 📖 Comment rédiger une bonne méthodologie de recherche\n\n"
                 . "Une méthodologie solide est le pilier de tout travail de recherche. Voici les **étapes essentielles** :\n\n"
                 . "### 1. Définir l'approche de recherche\n"
                 . "- **Qualitative** : entretiens, observations, analyses de contenu\n"
                 . "- **Quantitative** : expérimentations, enquêtes statistiques, modèles mathématiques\n"
                 . "- **Mixte** : combinaison des deux pour une vision complète\n\n"
                 . "### 2. Décrire le cadre théorique\n"
                 . "- Positionnez-vous par rapport aux travaux existants\n"
                 . "- Justifiez le choix de vos théories de référence\n\n"
                 . "### 3. Présenter la collecte de données\n"
                 . "- **Population et échantillonnage** : qui / quoi étudiez-vous ?\n"
                 . "- **Instruments** : questionnaires, capteurs, bases de données\n"
                 . "- **Protocole** : étapes précises et reproductibles\n\n"
                 . "### 4. Expliquer l'analyse des données\n"
                 . "- Tests statistiques utilisés (ANOVA, régression, etc.)\n"
                 . "- Logiciels d'analyse (SPSS, R, Python, NVivo)\n"
                 . "- Critères de validité et fiabilité\n\n"
                 . "### 5. Aborder les limites\n"
                 . "- Reconnaître les biais potentiels\n"
                 . "- Expliquer les mesures prises pour les atténuer\n\n"
                 . "### 💡 Conseils pratiques\n"
                 . "- Utilisez le **passé** pour décrire ce que vous avez fait\n"
                 . "- Soyez **suffisamment détaillé** pour permettre la reproductibilité\n"
                 . "- Faites **relire** par un pair avant soumission\n\n"
                 . "---\n📌 *Confiance : élevée — Cette réponse est basée sur les standards académiques reconnus.*";
        }

        // ── Gestion de projet ─────────────────────────────────────────────
        if (str_contains($question, 'gérer') || str_contains($question, 'gerer') || str_contains($question, 'gestion')) {
            return "## 📋 Comment bien gérer un projet de recherche\n\n"
                 . "La gestion de projet en recherche nécessite une approche structurée :\n\n"
                 . "### 1. 🎯 Définir les objectifs\n"
                 . "- Objectifs **SMART** : Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis\n"
                 . "- Identifier les livrables attendus\n\n"
                 . "### 2. 📅 Planifier\n"
                 . "- Découper en **Work Packages** et jalons\n"
                 . "- Utiliser un diagramme de **Gantt** ou un **Kanban**\n"
                 . "- Estimer les ressources nécessaires\n\n"
                 . "### 3. 👥 Organiser l'équipe\n"
                 . "- Attribuer des rôles clairs (PI, co-PI, doctorants, ingénieurs)\n"
                 . "- Définir les canaux de communication\n"
                 . "- Planifier des réunions régulières de suivi\n\n"
                 . "### 4. 📊 Suivre et adapter\n"
                 . "- Utiliser un outil de suivi (comme **CollabSearch** !)\n"
                 . "- Faire des points d'avancement hebdomadaires\n"
                 . "- Ajuster le plan en fonction des résultats\n\n"
                 . "### 5. 📝 Documenter\n"
                 . "- Tenir un journal de bord du projet\n"
                 . "- Archiver les décisions importantes\n"
                 . "- Préparer les rapports d'avancement\n\n"
                 . "### 💡 Conseil CollabSearch\n"
                 . "Vous pouvez utiliser la fonctionnalité **Tâches** de CollabSearch pour organiser votre projet en Kanban et assigner des tâches à vos collaborateurs.\n\n"
                 . "---\n📌 *Confiance : élevée — Basé sur les méthodologies de gestion de projet reconnues (PMBOK, Agile).*";
        }

        // ── Kanban / organisation ─────────────────────────────────────────
        if (str_contains($question, 'kanban') || str_contains($question, 'organiser') || str_contains($question, 'organisation')) {
            return "## 📋 Les meilleures pratiques Kanban pour la recherche\n\n"
                 . "Le Kanban est une méthode visuelle de gestion des tâches particulièrement adaptée à la recherche :\n\n"
                 . "### Colonnes recommandées\n"
                 . "1. **À faire** (Backlog) — Toutes les tâches identifiées\n"
                 . "2. **En cours** — Maximum 2-3 tâches simultanées par personne\n"
                 . "3. **En révision** — Tâches en attente de validation\n"
                 . "4. **Terminé** — Tâches complétées\n\n"
                 . "### Bonnes pratiques\n"
                 . "- ✅ **Limiter le travail en cours** (WIP limit) : pas plus de 3 tâches en cours\n"
                 . "- ✅ **Utiliser des étiquettes** : par priorité (haute/moyenne/basse) et par type (recherche/rédaction/code)\n"
                 . "- ✅ **Ajouter des dates d'échéance** pour suivre les deadlines\n"
                 . "- ✅ **Faire un standup hebdomadaire** pour discuter du board\n\n"
                 . "---\n📌 *Confiance : élevée*";
        }

        // ── Abstract / thèse ─────────────────────────────────────────────
        if (str_contains($question, 'abstract') || str_contains($question, 'résumé') || str_contains($question, 'thèse') || str_contains($question, 'these')) {
            return "## ✍️ Comment structurer un abstract de thèse\n\n"
                 . "Un abstract efficace suit une structure en **5 parties** :\n\n"
                 . "### 1. Contexte (1-2 phrases)\n"
                 . "Situez votre recherche dans le domaine. Quel est le problème général ?\n\n"
                 . "### 2. Problématique (1 phrase)\n"
                 . "Quelle lacune dans les connaissances adressez-vous ?\n\n"
                 . "### 3. Méthodologie (1-2 phrases)\n"
                 . "Comment avez-vous mené votre recherche ?\n\n"
                 . "### 4. Résultats principaux (2-3 phrases)\n"
                 . "Quelles sont vos découvertes majeures ? Chiffres clés.\n\n"
                 . "### 5. Conclusion / Impact (1 phrase)\n"
                 . "Quelle est la portée de vos résultats ?\n\n"
                 . "### 💡 Règles d'or\n"
                 . "- **150 à 300 mots** selon les normes de votre institution\n"
                 . "- Pas de jargon inutile\n"
                 . "- Pas de citations ni de références\n"
                 . "- Écrivez-le **en dernier**, après avoir terminé la thèse\n\n"
                 . "---\n📌 *Confiance : élevée — Basé sur les standards APA et conventions académiques.*";
        }

        // ── Rédaction scientifique ────────────────────────────────────────
        if (str_contains($question, 'rédiger') || str_contains($question, 'rediger') || str_contains($question, 'écrire') || str_contains($question, 'rédaction') || str_contains($question, 'redaction')) {
            return "## ✍️ Conseils pour la rédaction scientifique\n\n"
                 . "### Structure d'un article scientifique (IMRAD)\n"
                 . "1. **Introduction** — Contexte, problématique, objectifs\n"
                 . "2. **Méthodes** — Comment vous avez procédé\n"
                 . "3. **Résultats** — Ce que vous avez trouvé\n"
                 . "4. **Discussion** — Interprétation et implications\n\n"
                 . "### Bonnes pratiques\n"
                 . "- Utilisez la voix **active** quand c'est possible\n"
                 . "- Soyez **précis** et **concis** — chaque mot doit compter\n"
                 . "- Évitez les **adverbes vagues** (très, beaucoup, assez)\n"
                 . "- Utilisez des **connecteurs logiques** (cependant, par conséquent, en outre)\n"
                 . "- **Citez vos sources** de manière cohérente (APA, IEEE, Harvard)\n\n"
                 . "### Outils recommandés\n"
                 . "- **LaTeX** / Overleaf pour le formatage\n"
                 . "- **Zotero** / Mendeley pour les références\n"
                 . "- **Grammarly** pour la relecture\n\n"
                 . "---\n📌 *Confiance : élevée*";
        }

        // ── Analyse de données / IA ───────────────────────────────────────
        if (str_contains($question, 'analyser') || str_contains($question, 'analyse de données') || str_contains($question, 'intelligence artificielle') || str_contains($question, ' ia ') || str_contains($question, "l'ia")) {
            return "## 🔬 Analyse de données et IA pour la recherche\n\n"
                 . "### Étapes d'une analyse de données\n"
                 . "1. **Collecte** — Structurer vos données sources\n"
                 . "2. **Nettoyage** — Traiter les valeurs manquantes et aberrantes\n"
                 . "3. **Exploration** — Statistiques descriptives et visualisations\n"
                 . "4. **Modélisation** — Appliquer les algorithmes appropriés\n"
                 . "5. **Validation** — Cross-validation, métriques de performance\n"
                 . "6. **Interprétation** — Donner du sens aux résultats\n\n"
                 . "### Outils courants\n"
                 . "- **Python** (pandas, scikit-learn, TensorFlow)\n"
                 . "- **R** (tidyverse, ggplot2, caret)\n"
                 . "- **SPSS** pour les analyses statistiques classiques\n\n"
                 . "---\n📌 *Confiance : élevée*";
        }

        // ── Fallback intelligent ──────────────────────────────────────────
        // Pour les questions non couvertes, fournir une réponse utile
        $topicSummary = Str::limit($question, 60);
        return "## 🤖 Réponse à votre question\n\n"
             . "Je suis l'assistant IA de CollabSearch et je fonctionne actuellement en **mode local** (sans connexion à un modèle de langage externe).\n\n"
             . "Pour votre question « *{$topicSummary}* », je vous recommande de :\n\n"
             . "### Actions possibles\n"
             . "1. **Activer la recherche web** 🌐 pour que je puisse trouver des informations actualisées\n"
             . "2. **Reformuler votre question** en mentionnant un domaine spécifique (réunions, tâches, projets, publications)\n"
             . "3. **Configurer une clé API** (Claude ou OpenAI) dans le fichier `.env` pour obtenir des réponses complètes et intelligentes\n\n"
             . "### Ce que je sais faire en mode local\n"
             . "- 📅 Consulter vos **réunions** (\"Quelles sont mes réunions aujourd'hui ?\")\n"
             . "- 📝 Lister vos **tâches** (\"Mes tâches urgentes\")\n"
             . "- 📁 Explorer vos **projets** (\"Montre-moi mes projets\")\n"
             . "- 📚 Consulter vos **publications** scientifiques\n"
             . "- 🧠 Répondre à des questions de **méthodologie de recherche**\n\n"
             . "---\n💡 *Avec une clé API, je pourrai répondre à n'importe quelle question de manière intelligente et contextuelle.*";
    }

    protected function calculateMockConfidence(string $intent, string $systemPrompt): string
    {
        return match($intent) {
            'réunions', 'tâches', 'projets', 'membres', 'publications' => '0.92',
            'connaissance' => '0.85',
            default => str_contains($systemPrompt, 'RÉSULTATS DE RECHERCHE SUR LE WEB') ? '0.72' : '0.60',
        };
    }
}
