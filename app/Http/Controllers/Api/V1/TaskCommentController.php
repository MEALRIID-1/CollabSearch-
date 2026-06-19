<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;

/**
 * Contrôleur des commentaires de tâche - CollabSearch
 * 
 * Gère les opérations sur les commentaires des tâches :
 * création, liste et suppression.
 */
class TaskCommentController extends Controller
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    /**
     * Lister les commentaires d'une tâche
     */
    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task->project);

        $comments = $task->comments()->with('user')->latest()->paginate(20);

        return response()->json([
            'comments' => CommentResource::collection($comments),
        ]);
    }

    /**
     * Ajouter un commentaire à une tâche
     */
    public function store(StoreCommentRequest $request, Task $task): JsonResponse
    {
        $this->authorize('view', $task->project);

        try {
            $comment = $this->taskService->addComment(
                $task,
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'message' => 'Commentaire ajouté avec succès.',
                'comment' => new CommentResource($comment),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout du commentaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un commentaire
     */
    public function destroy(Task $task, int $commentId): JsonResponse
    {
        $comment = $task->comments()->findOrFail($commentId);

        $this->authorize('update', $task->project);

        try {
            $comment->delete();

            return response()->json([
                'message' => 'Commentaire supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du commentaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
