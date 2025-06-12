import { useState, useEffect } from 'react';
import {
    fetchUsers,
    User,
    fetchUserGroups,
    UserGroup,
    fetchPermissionGroups,
    PermissionGroup,
    fetchPermissions,
    Permission
} from '../api/userAccessControl';
import { UserTable } from '../components/handlers/UserTable';
import { GroupPermissionsTable } from '../components/handlers/GroupPermissionsTable';
import { Button } from '../components/ui/button';
import { HelpIcon } from '../components/HelpIcon';

export const UserManagementForm = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [usersData, groupsData, permissionsData, allPermissionsData] = await Promise.all([
                fetchUsers(),
                fetchUserGroups(),
                fetchPermissionGroups(),
                fetchPermissions()
            ]);
            setUsers(usersData);
            setUserGroups(groupsData);
            setPermissionGroups(permissionsData);
            setPermissions(allPermissionsData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Users</h2>
                    <HelpIcon 
                        tooltipText="Here you can add, update, and delete users. You can also add, update, groups and permissions."
                        helpPath="/helpManagingUsers"
                        size="md"
                    />
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                    + Add User
                </Button>
            </div>
            <UserTable
                users={users}
                userGroups={userGroups}
                isLoading={isLoading}
                onUpdate={loadData}
                onAddClick={() => setShowAddForm(true)}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
            />

            <GroupPermissionsTable
                userGroups={userGroups}
                permissionGroups={permissionGroups}
                permissions={permissions}
                onUpdate={loadData}
            />
        </div>
    );
}; 