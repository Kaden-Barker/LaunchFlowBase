import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// UserGroups API functions
export const fetchUserGroups = async () => {
    try {
        const response = await api.get('/usergroups');
        return response.data;
    } catch (error) {
        console.error('Error fetching user groups:', error);
        throw error;
    }
};

export const createUserGroup = async (groupName: string) => {
    try {
        const response = await api.post('/usergroups', { groupName });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 400) {
            throw new Error(error.response.data.error);
        }
        console.error('Error creating user group:', error);
        throw error;
    }
};

export const updateUserGroup = async (groupId: number, newGroupName: string) => {
    try {
        const response = await api.put(`/usergroups/${groupId}`, { newGroupName });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 400) {
            throw new Error(error.response.data.error);
        }
        console.error('Error updating user group:', error);
        throw error;
    }
};

export const deleteUserGroup = async (groupId: number) => {
    try {
        const response = await api.delete(`/usergroups/${groupId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user group:', error);
        throw error;
    }
};

// Users API functions
export const fetchUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const createUser = async (userName: string, userEmail: string, groupId?: number) => {
    try {
        const response = await api.post('/users', { userName, userEmail, groupID: groupId });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 400) {
            throw new Error(error.response.data.error);
        }
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (userId: number, newUserName: string, newUserEmail: string, newGroupId?: number) => {
    try {
        const response = await api.put(`/users/${userId}`, {
            newUserName,
            newUserEmail,
            newGroupID: newGroupId
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 400) {
            throw new Error(error.response.data.error);
        }
        console.error('Error updating user:', error);
        throw error;
    }
};

export const deleteUser = async (userId: number) => {
    try {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// PermissionGroup API functions
export const fetchPermissionGroups = async () => {
    try {
        const response = await api.get('/permissiongroup');
        return response.data;
    } catch (error) {
        console.error('Error fetching permission groups:', error);
        throw error;
    }
};

export const createPermissionGroup = async (permissionId: number, groupId: number) => {
    try {
        const response = await api.post('/permissiongroup', {
            permissionID: permissionId,
            groupID: groupId
        });
        return response.data;
    } catch (error) {
        console.error('Error creating permission group:', error);
        throw error;
    }
};

export const deletePermissionGroup = async (permissionId: number, groupId: number) => {
    try {
        const response = await api.delete(`/permissiongroup?permissionID=${permissionId}&groupID=${groupId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting permission group:', error);
        throw error;
    }
};

// Type definitions for better TypeScript support
export interface UserGroup {
    groupID: number;
    groupName: string;
}

export interface User {
    userID: number;
    userName: string;
    userEmail: string;
    groupID: number | null;
    groupName: string | null;
}

export interface PermissionGroup {
    permissionID: number;
    groupID: number;
    permissionName: string;
    groupName: string;
}

export interface Permission {
    permissionID: number;
    permissionName: string;
}

// Permission API functions
export const fetchPermissions = async () => {
    try {
        const response = await api.get('/permissions');
        return response.data;
    } catch (error) {
        console.error('Error fetching permissions:', error);
        throw error;
    }
};

// Add new interface for permission mapping
export interface PermissionMapping {
    permissionName: string;
    groupID: number;
}

// Add new function to check user permissions
export const checkUserPermission = async (userEmail: string, requiredPermission: string): Promise<boolean> => {
    try {
        // Get all users
        const users = await fetchUsers();
        const currentUser = users.find((user: User) => user.userEmail.toLowerCase() === userEmail.toLowerCase());

        if (!currentUser || !currentUser.groupID) {
            return false;
        }

        // Get all permission groups
        const permissionGroups = await fetchPermissionGroups();
        
        // Check if the user's group has the required permission
        const hasPermission = permissionGroups.some(
            (pg: PermissionGroup) => 
                pg.groupID === currentUser.groupID && 
                pg.permissionName.toLowerCase() === requiredPermission.toLowerCase()
        );

        return hasPermission;
    } catch (error) {
        console.error('Error checking user permission:', error);
        return false;
    }
}; 