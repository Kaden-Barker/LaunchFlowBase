import { useState } from 'react';
import { UserGroup, PermissionGroup, Permission, deleteUserGroup } from '../../api/userAccessControl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Check, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupForm } from './GroupForm';
import { DeleteConfirmationPopup } from './DeleteConfirmationPopup';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser, logUserAction } from "@/utils/loggingUtils";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

interface GroupPermissionsTableProps {
    userGroups: UserGroup[];
    permissionGroups: PermissionGroup[];
    permissions: Permission[];
    onUpdate: () => void;
}

export const GroupPermissionsTable = ({ userGroups, permissionGroups, permissions, onUpdate }: GroupPermissionsTableProps) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);
    const [showAdminAlert, setShowAdminAlert] = useState(false);
    const currentUser = useCurrentUser();

    // Create a map of group permissions for quick lookup
    const groupPermissionsMap = new Map<number, Set<string>>();
    permissionGroups.forEach(pg => {
        if (!groupPermissionsMap.has(pg.groupID)) {
            groupPermissionsMap.set(pg.groupID, new Set());
        }
        groupPermissionsMap.get(pg.groupID)?.add(pg.permissionName);
    });

    const handleDelete = async (group: UserGroup) => {
        if (group.groupName.toLowerCase() === 'admin') {
            setShowAdminAlert(true);
            return;
        }
        setGroupToDelete(group);
        setIsDeleteDialogOpen(true);
    };

    const handleEdit = (group: UserGroup) => {
        if (group.groupName.toLowerCase() === 'admin') {
            setShowAdminAlert(true);
            return;
        }
        setEditingGroup(group);
    };

    const confirmDelete = async () => {
        if (groupToDelete) {
            try {
                const perms = permissionGroups.filter(pg => pg.groupID === groupToDelete.groupID).map(pg => pg.permissionName);
                await deleteUserGroup(groupToDelete.groupID);
                await logUserAction(
                    "Delete Group",
                    `Deleted group: ${groupToDelete.groupName}, Permissions: ${perms.length > 0 ? perms.join(", ") : 'No Permissions'}`,
                    currentUser
                );
                onUpdate();
                setIsDeleteDialogOpen(false);
                setGroupToDelete(null);
            } catch (error) {
                console.error('Error deleting group:', error);
                alert('Error deleting group. Please try again.');
            }
        }
    };

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Group Permissions</h3>
                <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Group
                </Button>
            </div>

            {/* Add Group Modal */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Group</DialogTitle>
                    </DialogHeader>
                    <GroupForm
                        permissions={permissions}
                        permissionGroups={permissionGroups}
                        onSuccess={() => {
                            setShowAddForm(false);
                            onUpdate();
                        }}
                        onCancel={() => setShowAddForm(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Group Modal */}
            <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Group</DialogTitle>
                    </DialogHeader>
                    {editingGroup && (
                        <GroupForm
                            group={editingGroup}
                            permissions={permissions}
                            permissionGroups={permissionGroups}
                            onSuccess={() => {
                                setEditingGroup(null);
                                onUpdate();
                            }}
                            onCancel={() => setEditingGroup(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationPopup
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                itemType="group"
                itemName={groupToDelete?.groupName || ''}
            />

            {/* Admin Group Alert Dialog */}
            <AlertDialog open={showAdminAlert} onOpenChange={setShowAdminAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Admin Group Protected</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sorry, for security reasons, the admin group cannot be updated or deleted from this interface.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="max-h-[500px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Group Name</TableHead>
                            {permissions.map(permission => (
                                <TableHead key={permission.permissionID} className="text-center">
                                    {permission.permissionName}
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {userGroups.map(group => (
                            <TableRow key={group.groupID}>
                                <TableCell className="font-medium">
                                    {group.groupName}
                                </TableCell>
                                {permissions.map(permission => {
                                    const hasPermission = groupPermissionsMap
                                        .get(group.groupID)
                                        ?.has(permission.permissionName);
                                    
                                    return (
                                        <TableCell key={permission.permissionID} className="text-center">
                                            {hasPermission ? (
                                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : (
                                                <div className="h-5 w-5 border border-gray-300 rounded mx-auto" />
                                            )}
                                        </TableCell>
                                    );
                                })}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(group)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(group)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}; 