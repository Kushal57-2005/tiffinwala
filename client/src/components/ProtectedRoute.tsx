import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types/auth.types';

interface ProtectedRouteProps {
    /** If provided, only users with this role can access the route. */
    allowedRole?: Role;
    /** Where to redirect unauthenticated users (default: /login). */
    redirectTo?: string;
}

/**
 * Wraps a set of routes so that:
 *  - Unauthenticated users are redirected to `redirectTo` (default /login).
 *  - If `allowedRole` is set, users with the wrong role are redirected to
 *    their own home page (e.g. a customer visiting /vendor/* goes to /customer/home).
 *
 * While the auth state is still loading (initial fetchUser call) we render
 * nothing to avoid a flash of the redirect.
 */
export function ProtectedRoute({
    allowedRole,
    redirectTo = '/login',
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    // Wait for the initial auth check to finish before making a decision.
    if (isLoading) {
        return null; // or a full-page spinner if you prefer
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRole && user?.role !== allowedRole) {
        // Redirect to the user's own home page.
        const home = user?.role === 'vendor' ? '/vendor/home' : '/customer/home';
        return <Navigate to={home} replace />;
    }

    return <Outlet />;
}
