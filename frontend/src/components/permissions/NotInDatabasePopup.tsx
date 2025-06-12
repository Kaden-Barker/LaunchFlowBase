import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface NotInDatabasePopupProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NotInDatabasePopup = ({ isOpen, onOpenChange }: NotInDatabasePopupProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        User Not Found
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-center">
                        You are logged in with Microsoft, but are not a user in the Rusted Gate Database.
                        Talk with your manager to get this fixed.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 