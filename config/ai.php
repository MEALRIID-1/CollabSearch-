<?php

return [
    'provider' => env('AI_PROVIDER', 'groq'),
    'anthropic_key' => env('ANTHROPIC_API_KEY'),
    'openai_key' => env('OPENAI_API_KEY'),
    'groq_key' => env('GROQ_API_KEY'),
    'gemini_key' => env('GEMINI_API_KEY'),
    'ollama_host' => env('OLLAMA_HOST', 'http://localhost:11434'),
    'ollama_model' => env('OLLAMA_MODEL', 'llama3.2'),
    'max_tokens' => env('AI_MAX_TOKENS', 4096),
    'temperature' => env('AI_TEMPERATURE', 0.3),
    // Recherche web
    'serper_key' => env('SERPER_API_KEY'),
    'tavily_key' => env('TAVILY_API_KEY'),
];
