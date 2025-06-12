import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn } from "lucide-react";

interface LoginRequiredPopupProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LoginRequiredPopup = ({ isOpen, onOpenChange }: LoginRequiredPopupProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-600">
                        <LogIn className="h-5 w-5" />
                        Login Required
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-center">
                        You need to login to access this page.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 