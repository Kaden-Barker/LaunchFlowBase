import { Navigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../handlers/UserContext';
import { PermissionDeniedPopup } from './PermissionDeniedPopup';
import { LoginRequiredPopup } from './LoginRequiredPopup';
import { useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string | string[];  // Can be a single permission or array of permissions
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
    const { inProgress } = useMsal();
    const { currentUser, userPermissions, isLoading, isEmergencyAccess } = useUser();
    const [showPermissionDenied, setShowPermissionDenied] = useState(false);
    const [showLoginRequired, setShowLoginRequired] = useState(false);

    // If in emergency access mode, allow access to everything
    if (isEmergencyAccess) {
        return <>{children}</>;
    }

    // If MSAL is still initializing or user data is loading, show loading state
    if (inProgress !== 'none' || isLoading) {
        return <div>Loading...</div>; // You might want to replace this with a proper loading component
    }

    // If user is not logged in or not in our database
    if (!currentUser) {
        // First redirect to home, then show popup
        return (
            <>
                <Navigate to="/" state={{ showLoginPopup: true }} replace />
                <LoginRequiredPopup 
                    isOpen={showLoginRequired} 
                    onOpenChange={setShowLoginRequired} 
                />
            </>
        );
    }

    // If no specific permission is required, just being in the database is enough
    if (!requiredPermission) {
        return <>{children}</>;
    }

    // Check if user has any of the required permissions
    const hasPermission = Array.isArray(requiredPermission)
        ? requiredPermission.some(permission => userPermissions.includes(permission))
        : userPermissions.includes(requiredPermission);

    if (!hasPermission) {
        // First redirect to home, then show popup
        return (
            <>
                <Navigate to="/" state={{ showPermissionPopup: true }} replace />
                <PermissionDeniedPopup 
                    isOpen={showPermissionDenied} 
                    onOpenChange={setShowPermissionDenied} 
                />
            </>
        );
    }

    return <>{children}</>;
}; 