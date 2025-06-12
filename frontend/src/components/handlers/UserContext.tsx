import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { User, PermissionGroup, fetchUsers, fetchPermissionGroups, fetchPermissions } from '../../api/userAccessControl';

// Special emergency admin user
const EMERGENCY_ADMIN_USER: User = {
    userID: -1, // Special ID for emergency admin
    userName: import.meta.env.VITE_EMERGENCY_ADMIN_USERNAME,
    userEmail: import.meta.env.VITE_EMERGENCY_ADMIN_PASSWORD,
    groupID: -1, // Special group ID for emergency admin
    groupName: 'Emergency Access'
};

// Constants for session storage
const EMERGENCY_ACCESS_KEY = 'emergency_access';
const LAST_ACTIVITY_KEY = 'last_activity';
const EMERGENCY_INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const MSAL_INACTIVITY_TIMEOUT = 10 * 60 * 60 * 1000; // 10 hours in milliseconds

interface UserContextType {
    currentUser: User | null;
    userPermissions: string[];
    isLoading: boolean;
    refreshUserData: () => Promise<void>;
    clearUserData: () => void;
    isEmergencyAccess: boolean;
    setEmergencyAccess: (value: boolean) => void;
    showNotInDatabasePopup: boolean;
    setShowNotInDatabasePopup: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Permission check functions
export const hasUpdatePermission = (userPermissions: string[], isEmergencyAccess: boolean): boolean => {
    return isEmergencyAccess || userPermissions.includes("update_data");
};

export const hasDeletePermission = (userPermissions: string[], isEmergencyAccess: boolean): boolean => {
    return isEmergencyAccess || userPermissions.includes("delete_data");
};

export function UserProvider({ children }: { children: ReactNode }) {
    const { accounts, inProgress, instance } = useMsal();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNotInDatabasePopup, setShowNotInDatabasePopup] = useState(false);
    const [isEmergencyAccess, setIsEmergencyAccess] = useState(() => {
        // Initialize from session storage
        const storedAccess = sessionStorage.getItem(EMERGENCY_ACCESS_KEY);
        const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
        
        if (storedAccess === 'true' && lastActivity) {
            const lastActivityTime = parseInt(lastActivity);
            const currentTime = Date.now();
            
            // Check if the session has expired
            if (currentTime - lastActivityTime > EMERGENCY_INACTIVITY_TIMEOUT) {
                // Clear expired session
                sessionStorage.removeItem(EMERGENCY_ACCESS_KEY);
                sessionStorage.removeItem(LAST_ACTIVITY_KEY);
                return false;
            }
            return true;
        }
        return false;
    });

    // Update last activity time on user interaction
    useEffect(() => {
        const updateLastActivity = () => {
            if (isEmergencyAccess) {
                sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
            }
            // Store last activity for MSAL users as well
            if (accounts.length > 0) {
                sessionStorage.setItem('msal_last_activity', Date.now().toString());
            }
        };

        // Add event listeners for user activity
        window.addEventListener('mousemove', updateLastActivity);
        window.addEventListener('keydown', updateLastActivity);
        window.addEventListener('click', updateLastActivity);
        window.addEventListener('scroll', updateLastActivity);

        // Check for inactivity periodically
        const inactivityCheck = setInterval(() => {
            // Check emergency access timeout
            if (isEmergencyAccess) {
                const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
                if (lastActivity) {
                    const lastActivityTime = parseInt(lastActivity);
                    const currentTime = Date.now();
                    
                    if (currentTime - lastActivityTime > EMERGENCY_INACTIVITY_TIMEOUT) {
                        // Clear emergency access
                        clearUserData();
                    }
                }
            }

            // Check MSAL session timeout
            if (accounts.length > 0) {
                const lastActivity = sessionStorage.getItem('msal_last_activity');
                if (lastActivity) {
                    const lastActivityTime = parseInt(lastActivity);
                    const currentTime = Date.now();
                    
                    if (currentTime - lastActivityTime > MSAL_INACTIVITY_TIMEOUT) {
                        // Log out MSAL user
                        instance.logoutRedirect();
                    }
                }
            }
        }, 60000); // Check every minute

        return () => {
            // Cleanup event listeners
            window.removeEventListener('mousemove', updateLastActivity);
            window.removeEventListener('keydown', updateLastActivity);
            window.removeEventListener('click', updateLastActivity);
            window.removeEventListener('scroll', updateLastActivity);
            clearInterval(inactivityCheck);
        };
    }, [isEmergencyAccess, accounts, instance]);

    const clearUserData = () => {
        setCurrentUser(null);
        setUserPermissions([]);
        setIsEmergencyAccess(false);
        setShowNotInDatabasePopup(false);
        sessionStorage.removeItem(EMERGENCY_ACCESS_KEY);
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        sessionStorage.removeItem('msal_last_activity');
    };

    const setEmergencyAccessWithStorage = (value: boolean) => {
        setIsEmergencyAccess(value);
        if (value) {
            sessionStorage.setItem(EMERGENCY_ACCESS_KEY, 'true');
            sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        } else {
            sessionStorage.removeItem(EMERGENCY_ACCESS_KEY);
            sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        }
    };

    const loadUserData = async () => {
        // If in emergency access mode, set emergency admin user
        if (isEmergencyAccess) {
            setCurrentUser(EMERGENCY_ADMIN_USER);
            
            try {
                // Fetch all permissions from the database and give the emergency admin all permissions
                const allPermissions = await fetchPermissions();
                
                // Get unique permission names and ensure they are strings
                const uniquePermissions: string[] = Array.from(
                    new Set(allPermissions.map((p: PermissionGroup) => p.permissionName))
                );

                if (uniquePermissions.length === 0) {
                    console.error('No permissions found in the database');
                    clearUserData();
                    return;
                }

                setUserPermissions(uniquePermissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
                clearUserData();
                return;
            }
            
            setIsLoading(false);
            return;
        }

        // Clear data if no accounts are present
        if (inProgress === 'none' && accounts.length === 0) {
            clearUserData();
            setIsLoading(false);
            return;
        }

        try {
            const userEmail = accounts[0]?.username;
            if (!userEmail) {
                clearUserData();
                setIsLoading(false);
                return;
            }

            // Set initial activity timestamp for MSAL user
            sessionStorage.setItem('msal_last_activity', Date.now().toString());

            // Fetch user data
            const users = await fetchUsers();
            const user = users.find((u: User) => u.userEmail.toLowerCase() === userEmail.toLowerCase());
            
            if (!user) {
                clearUserData();
                setShowNotInDatabasePopup(true);
                setIsLoading(false);
                return;
            }

            setCurrentUser(user);
            setShowNotInDatabasePopup(false);

            // Fetch and set permissions
            const permissionGroups = await fetchPermissionGroups();
            const permissions = permissionGroups
                .filter((pg: PermissionGroup) => pg.groupID === user.groupID)
                .map((pg: PermissionGroup) => pg.permissionName);

            setUserPermissions(permissions);
        } catch (error) {
            console.error('Error loading user data:', error);
            clearUserData();
        } finally {
            setIsLoading(false);
        }
    };

    // Load user data when MSAL state changes
    useEffect(() => {
        loadUserData();
    }, [accounts, inProgress]);

    return (
        <UserContext.Provider value={{ 
            currentUser, 
            userPermissions, 
            isLoading, 
            refreshUserData: loadUserData,
            clearUserData,
            isEmergencyAccess,
            setEmergencyAccess: setEmergencyAccessWithStorage,
            showNotInDatabasePopup,
            setShowNotInDatabasePopup
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 