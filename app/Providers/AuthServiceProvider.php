<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

/**
 * Service provider d'authentification et d'autorisation.
 *
 * Enregistre les politiques et les gates de l'application.
 */
class AuthServiceProvider extends ServiceProvider
{
    /**
     * Les politiques d'autorisation de l'application.
     *
     * @var array
     */
    protected $policies = [
        User::class => UserPolicy::class,
        \App\Models\CustomRole::class => \App\Policies\CustomRolePolicy::class,
    ];

    /**
     * Enregistrer les services d'autorisation.
     */
    public function boot()
    {
        $this->registerPolicies();

        \App\Models\Task::observe(\App\Observers\TaskObserver::class);
        \App\Models\Milestone::observe(\App\Observers\MilestoneObserver::class);
        \App\Models\CustomRole::observe(\App\Observers\CustomRoleObserver::class);

        Gate::define('access-admin-dashboard', fn (User $user) => $user->hasRole('administrator'));
        Gate::define('access-admin-users', fn (User $user) => $user->hasRole('administrator'));
        Gate::define('access-admin-stats', fn (User $user) => $user->hasRole('administrator'));
    }
}
