import { Link } from "react-router-dom";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Home, FolderPlus, Layers, Columns, Upload, Settings, Search, History, HelpCircle, Users, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: <Home size={20} /> },
  { to: "/addCategory", label: "Add Category", icon: <FolderPlus size={20} /> },
  { to: "/addAssetType", label: "Add Group", icon: <Layers size={20} /> },
  { to: "/addField", label: "Add Field", icon: <Columns size={20} /> },
  { to: "/insertPage", label: "Insert Data", icon: <Upload size={20} /> },
  { to: "/updatePage", label: "Manage Data", icon: <Settings size={20} /> },
  { to: "/queryPage", label: "Search Data", icon: <Search size={20} /> },
  { to: "/loggingPage", label: "Change Log", icon: <History size={20} /> },
  { to: "/helpPage", label: "Help", icon: <HelpCircle size={20} /> },
  { to: "/userAccessControl", label: "User Management", icon: <Users size={20} /> },
];

const HamburgerMenu = () => {
  // Define divider indices for logical sections
  const dividers = [1, 4, 6, 8]; // After Home, Insert Data, Search Data, Help
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center bg-transparent border-none p-0 m-0 text-white hover:opacity-80 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="h-8 w-8" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-gradient-to-br from-[#181A20] to-[#23272F] text-gray-100 border-l border-blue-900 shadow-2xl p-0">
        <div className="px-6 pt-12 pb-2">
          <SheetTitle className="text-2xl font-bold text-blue-400 drop-shadow-lg">Navigation</SheetTitle>
        </div>
        <nav className="flex flex-col gap-2 px-4 py-4">
          {navItems.map((item, idx) => (
            <>
              <Link key={item.to} to={item.to} className="group">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#23272F] hover:bg-blue-700/80 text-gray-100 rounded-xl font-semibold shadow transition-all duration-150 border border-gray-800">
                  <span className="text-blue-400 group-hover:text-white transition-colors">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </button>
              </Link>
              {dividers.includes(idx + 1) && (
                <hr className="my-2 border-t border-blue-900/60" />
              )}
            </>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
