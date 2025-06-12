import { Link } from "react-router-dom";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const HamburgerMenu = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-transparent border-none p-0 m-0 text-white hover:opacity-80 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6 sm:h-5 sm:w-5 md:h-8 md:w-8 lg:h-10 lg:w-10" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="bg-gray-100 text-black">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl text-left">Navigation</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-4">
          <Link to="/">
            <button className="w-full px-4 py-2 bg-[#876454] hover:bg-[#6f4e3e] text-white rounded-lg">
              Home
            </button>
          </Link>
          <Link to="/addCategory">
            <button className="w-full px-4 py-2 bg-[#876454] hover:bg-[#6f4e3e] text-white rounded-lg">
              Add a Category
            </button>
          </Link>
          <Link to="/addAssetType">
            <button className="w-full px-4 py-2 bg-[#876454] hover:bg-[#6f4e3e] text-white rounded-lg">
              Add a Group
            </button>
          </Link>
          <Link to="/addField">
            <button className="w-full px-4 py-2 bg-[#876454] hover:bg-[#6f4e3e] text-white rounded-lg">
              Add a new Field
            </button>
          </Link>
          <Link to="/insertPage">
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
              Insert Data
            </button>
          </Link>
          <Link to="/updatePage">
            <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold">
              Manage Data
            </button>
          </Link>
          <Link to="/queryPage">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
              Search Data
            </button>
          </Link>
          <Link to="/loggingPage">
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
              Change Log
            </button>
          </Link>
          <Link to="/helpPage">
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
              Help
            </button>
          </Link>
          <Link to="/userAccessControl">
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
              User Management
            </button>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
