import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface PermissionDeniedPopupProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PermissionDeniedPopup = ({ isOpen, onOpenChange }: PermissionDeniedPopupProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        Permission Denied
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-center">
                        You currently do not have permission to access this page.
                        If you need access, please talk to your manager.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 