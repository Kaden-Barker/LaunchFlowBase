import { useState } from 'react';
import { 
    createUserGroup, 
    updateUserGroup, 
    createPermissionGroup,
    deletePermissionGroup,
    PermissionGroup,
    UserGroup,
    Permission
} from '../../api/userAccessControl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { useCurrentUser, logUserAction } from "@/utils/loggingUtils";

interface GroupFormProps {
    group?: UserGroup;
    permissions: Permission[];
    permissionGroups: PermissionGroup[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const GroupForm = ({ group, permissions, permissionGroups, onSuccess, onCancel }: GroupFormProps) => {
    const [formData, setFormData] = useState({
        groupName: group?.groupName || '',
        selectedPermissions: new Set(
            permissionGroups
                .filter(pg => pg.groupID === group?.groupID)
                .map(pg => pg.permissionID)
        )
    });
    const [isLoading, setIsLoading] = useState(false);
    const currentUser = useCurrentUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.groupName) {
            alert('Please enter a group name');
            return;
        }

        try {
            setIsLoading(true);
            
            if (group) {
                // --- LOGGING: Capture old state ---
                const oldGroupName = group.groupName;
                const oldPerms = permissionGroups.filter(pg => pg.groupID === group.groupID).map(pg => pg.permissionName);
                // Update existing group name
                await updateUserGroup(group.groupID, formData.groupName);

                // Get current permissions for this group
                const currentPermissionIds = new Set(
                    permissionGroups
                        .filter(pg => pg.groupID === group.groupID)
                        .map(pg => pg.permissionID)
                );
                const selectedPermissionIds = formData.selectedPermissions;

                // Permissions to add
                const toAdd = Array.from(selectedPermissionIds).filter(pid => !currentPermissionIds.has(pid));
                // Permissions to remove
                const toRemove = Array.from(currentPermissionIds).filter(pid => !selectedPermissionIds.has(pid));

                // Add new permissions
                for (const permissionId of toAdd) {
                    await createPermissionGroup(permissionId, group.groupID);
                }
                // Remove unselected permissions
                for (const permissionId of toRemove) {
                    await deletePermissionGroup(permissionId, group.groupID);
                }
                // --- LOGGING: Capture new state ---
                const newGroupName = formData.groupName;
                const newPerms = permissions.filter(p => formData.selectedPermissions.has(p.permissionID)).map(p => p.permissionName);
                const changes: string[] = [];
                if (oldGroupName !== newGroupName) {
                    changes.push(`name: ${oldGroupName} → ${newGroupName}`);
                }
                const added = newPerms.filter(p => !oldPerms.includes(p));
                const removed = oldPerms.filter(p => !newPerms.includes(p));
                if (added.length > 0) changes.push(`permissions added: ${added.join(", ")}`);
                if (removed.length > 0) changes.push(`permissions removed: ${removed.join(", ")}`);
                if (changes.length > 0) {
                    await logUserAction(
                        "Update Group",
                        `Updated group (${oldGroupName}): ` + changes.join(", "),
                        currentUser
                    );
                }
            } else {
                // Create new group
                const newGroup = await createUserGroup(formData.groupName);
                // Add permissions to the new group
                for (const permissionId of formData.selectedPermissions) {
                    await createPermissionGroup(permissionId, newGroup.groupID);
                }
                // --- LOGGING: Log add ---
                const perms = permissions.filter(p => formData.selectedPermissions.has(p.permissionID)).map(p => p.permissionName);
                await logUserAction(
                    "Add Group",
                    `Added group: ${formData.groupName}, Permissions: ${perms.length > 0 ? perms.join(", ") : 'No Permissions'}`,
                    currentUser
                );
            }
            
            onSuccess();
        } catch (error) {
            console.error('Error saving group:', error);
            alert(error instanceof Error ? error.message : 'An error occurred while saving the group');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (permissionId: number) => {
        const newPermissions = new Set(formData.selectedPermissions);
        if (newPermissions.has(permissionId)) {
            newPermissions.delete(permissionId);
        } else {
            newPermissions.add(permissionId);
        }
        setFormData({ ...formData, selectedPermissions: newPermissions });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="groupName" className="block text-sm font-medium">
                    Group Name
                </label>
                <Input
                    id="groupName"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Enter group name"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium">
                    Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {permissions.map(permission => (
                        <div
                            key={permission.permissionID}
                            className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                            onClick={() => togglePermission(permission.permissionID)}
                        >
                            <div className="w-5 h-5 border rounded flex items-center justify-center">
                                {formData.selectedPermissions.has(permission.permissionID) && (
                                    <Check className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                            <span>{permission.permissionName}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : group ? 'Update Group' : 'Create Group'}
                </Button>
            </div>
        </form>
    );
}; 