import { useState } from 'react';
import { createUser, updateUser, User, UserGroup } from '../../api/userAccessControl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserFormProps {
    user?: User;
    userGroups: UserGroup[];
    onSuccess: (user: User) => void;
    onCancel: () => void;
}

export const UserForm = ({ user, userGroups, onSuccess, onCancel }: UserFormProps) => {
    const [formData, setFormData] = useState({
        userName: user?.userName || '',
        userEmail: user?.userEmail || '',
        groupID: user?.groupID ?? null
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userName || !formData.userEmail) {
            alert('Please enter a name and email');
            return;
        }
        try {
            setIsLoading(true);
            if (user) {
                // Edit mode
                await updateUser(user.userID, formData.userName, formData.userEmail, formData.groupID ?? undefined);
                const updatedUser: User = {
                    ...user,
                    userName: formData.userName,
                    userEmail: formData.userEmail,
                    groupID: formData.groupID ?? null,
                    groupName: userGroups.find(g => g.groupID === formData.groupID)?.groupName || null
                };
                onSuccess(updatedUser);
            } else {
                // Add mode
                await createUser(formData.userName, formData.userEmail, formData.groupID ?? undefined);
                const createdUser: User = {
                    userID: 0, // or undefined if not available
                    userName: formData.userName,
                    userEmail: formData.userEmail,
                    groupID: formData.groupID ?? null,
                    groupName: userGroups.find(g => g.groupID === formData.groupID)?.groupName || null
                };
                onSuccess(createdUser);
            }
        } catch (error) {
            alert('Error saving user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="userName" className="block text-sm font-medium">
                    Name
                </label>
                <Input
                    id="userName"
                    value={formData.userName}
                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Enter user name"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="userEmail" className="block text-sm font-medium">
                    Email
                </label>
                <Input
                    id="userEmail"
                    value={formData.userEmail}
                    onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Enter user email"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="groupID" className="block text-sm font-medium">
                    Group
                </label>
                <select
                    id="groupID"
                    value={formData.groupID ?? ''}
                    onChange={e => setFormData({ ...formData, groupID: e.target.value ? Number(e.target.value) : null })}
                    disabled={isLoading}
                    className="w-full border rounded p-2"
                >
                    <option value="">No Group</option>
                    {userGroups.map(group => (
                        <option key={group.groupID} value={group.groupID}>{group.groupName}</option>
                    ))}
                </select>
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
                    {isLoading ? 'Saving...' : user ? 'Update User' : 'Add User'}
                </Button>
            </div>
        </form>
    );
}; 