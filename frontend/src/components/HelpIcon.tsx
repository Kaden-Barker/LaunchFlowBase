import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HelpIconProps {
    tooltipText: string;
    helpPath: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    tooltipPosition?: "top" | "bottom" | "left" | "right";
}

export const HelpIcon = ({ 
    tooltipText, 
    helpPath, 
    size = "md", 
    className = "",
    tooltipPosition = "right"
}: HelpIconProps) => {
    const navigate = useNavigate();
    
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
    };

    const tooltipPositionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2"
    };

    return (
        <div className="relative group">
            <HelpCircle 
                className={`${sizeClasses[size]} text-gray-500 cursor-pointer hover:text-gray-700 ${className}`}
                onClick={() => navigate(helpPath)}
            />
            <div className={`absolute ${tooltipPositionClasses[tooltipPosition]} w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                {tooltipText}
            </div>
        </div>
    );
}; 