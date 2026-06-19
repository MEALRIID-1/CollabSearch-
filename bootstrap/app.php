<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\AppServiceProvider::class,
    ])
    ->withCommands([
        App\Console\Commands\ServeCommand::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        $middleware->redirectGuestsTo(fn () => '/api/v1/auth/login');
        $middleware->appendToGroup('api', [
            \App\Http\Middleware\ApiRateLimiter::class,
        ]);
        $middleware->alias([
            'role'              => \App\Http\Middleware\CheckRole::class,
            'custom_permission' => \App\Http\Middleware\CheckCustomPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->renderable(function (AuthenticationException $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => $exception->getMessage() ?: 'Unauthenticated.',
                ], 401);
            }
        });
        //
    })->create();
