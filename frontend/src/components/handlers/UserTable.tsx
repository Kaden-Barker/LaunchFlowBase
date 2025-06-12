import { useState } from 'react';
import { User, UserGroup, deleteUser } from '../../api/userAccessControl';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { UserForm } from './UserForm';
import { DeleteConfirmationPopup } from './DeleteConfirmationPopup';
import { useCurrentUser, logUserAction } from "@/utils/loggingUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserTableProps {
    users: User[];
    userGroups: UserGroup[];
    isLoading: boolean;
    onUpdate: () => void;
    onAddClick: () => void;
    showAddForm: boolean;
    setShowAddForm: (open: boolean) => void;
}

export const UserTable = ({ users, userGroups, isLoading, onUpdate, showAddForm, setShowAddForm }: UserTableProps) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const currentUser = useCurrentUser();

    // Add User
    const handleAddUser = async (newUser: User) => {
        setShowAddForm(false);
        await logUserAction(
            "Add User",
            `Added user: Name: ${newUser.userName}, Email: ${newUser.userEmail}, Group: ${newUser.groupName || 'No Group'}`,
            currentUser
        );
        onUpdate();
    };

    // Edit User
    const handleEditUser = async (updatedUser: User) => {
        setEditingUser(null);
        // Find the old user data for comparison
        const oldUser = users.find(u => u.userID === updatedUser.userID);
        if (oldUser) {
            const changes: string[] = [];
            if (oldUser.userName !== updatedUser.userName) {
                changes.push(`name: ${oldUser.userName} → ${updatedUser.userName}`);
            }
            if (oldUser.userEmail !== updatedUser.userEmail) {
                changes.push(`email: ${oldUser.userEmail} → ${updatedUser.userEmail}`);
            }
            if ((oldUser.groupName || 'No Group') !== (updatedUser.groupName || 'No Group')) {
                changes.push(`group: ${oldUser.groupName || 'No Group'} → ${updatedUser.groupName || 'No Group'}`);
            }
            if (changes.length > 0) {
                await logUserAction(
                    "Update User",
                    `Updated user #${oldUser.userID} (${oldUser.userEmail}): ` + changes.join(", "),
                    currentUser
                );
            }
        }
        onUpdate();
    };

    // Delete User
    const handleDelete = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };
    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                setIsActionLoading(true);
                await deleteUser(userToDelete.userID);
                await logUserAction(
                    "Delete User",
                    `Deleted user: Name: ${userToDelete.userName}, Email: ${userToDelete.userEmail}, Group: ${userToDelete.groupName || 'No Group'}`,
                    currentUser
                );
                onUpdate();
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
            } catch (error) {
                alert('Error deleting user. Please try again.');
            } finally {
                setIsActionLoading(false);
            }
        }
    };

    return (
        <>
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>User Email</TableHead>
                            <TableHead>Group</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userID}>
                                <TableCell>{user.userName}</TableCell>
                                <TableCell>{user.userEmail}</TableCell>
                                <TableCell>{user.groupName || 'No Group'}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingUser(user)}
                                        disabled={isLoading || isActionLoading}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(user)}
                                        disabled={isLoading || isActionLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Add User Modal */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <UserForm
                        userGroups={userGroups}
                        onSuccess={handleAddUser}
                        onCancel={() => setShowAddForm(false)}
                    />
                </DialogContent>
            </Dialog>
            {/* Edit User Modal */}
            <Dialog open={!!editingUser} onOpenChange={open => { if (!open) setEditingUser(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <UserForm
                            user={editingUser}
                            userGroups={userGroups}
                            onSuccess={handleEditUser}
                            onCancel={() => setEditingUser(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <DeleteConfirmationPopup
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                itemType="user"
                itemName={userToDelete?.userEmail || ''}
            />
        </>
    );
}; 