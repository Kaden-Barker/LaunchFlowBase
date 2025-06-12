import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HamburgerNav from "@/components/hamburgerNav";
import { useMsal } from "@azure/msal-react";
import LoginButton from "../components/LoginButton";
import UserProfile from "../components/UserProfile";
import { LoginRequiredPopup } from "../components/permissions/LoginRequiredPopup";
import { PermissionDeniedPopup } from "../components/permissions/PermissionDeniedPopup";
import { NotInDatabasePopup } from "../components/permissions/NotInDatabasePopup";
import { useUser } from "../components/handlers/UserContext";

const Home = () => {
  const { accounts } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const { showNotInDatabasePopup, setShowNotInDatabasePopup } = useUser();

  useEffect(() => {
    // Check if we were redirected with popup flags
    if (location.state) {
      if (location.state.showLoginPopup) {
        setShowLoginPopup(true);
        // Clear the location state
        navigate(location.pathname, { replace: true });
      } else if (location.state.showPermissionPopup) {
        setShowPermissionPopup(true);
        // Clear the location state
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-100">
      {/* Header Bar */}
      <header className="relative bg-[#876454] text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-center py-6 px-4 md:px-8">
          {/* Logo (top-left) */}
          <img 
            src="/rgf_logo.png"
            alt="RGF Logo" 
            className="absolute top-2 left-4 max-w-[150px] md:max-w-[165px] h-auto hidden min-[900px]:block"
          />

          {/* Page Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mt-1">
            Rusted Gate Farm
          </h1>

          {/* Hamburger Nav - Mobile */}
          <div className="absolute right-1 top-1/3 -translate-y-1/2 md:hidden">
            <HamburgerNav />
          </div>
        </div>

        {/* Mobile Login/User Profile */}
        <div className="md:hidden flex justify-center items-center pb-4">
          {accounts.length > 0 ? <UserProfile /> : <LoginButton />}
        </div>

        {/* Desktop Login/User Profile and Nav */}
        <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center space-x-20">
          {accounts.length > 0 ? <UserProfile /> : <LoginButton />}
          <div className="ml-4">
            <HamburgerNav />
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-16 w-3/4 bg-white p-8 rounded-xl shadow-lg">
          
          {/* Left Column - Editing Tables */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Editing Tables</h2>
            <Link to="/addCategory">
              <button className="px-6 py-2 bg-[#876454] text-white rounded-lg hover:bg-[#6f4e3e] mb-2">
                Add a Category
              </button>
            </Link>
            <Link to="/addAssetType">
              <button className="px-6 py-2 bg-[#876454] text-white rounded-lg hover:bg-[#6f4e3e] mb-2">
                Add a Group
              </button>
            </Link>
            <Link to="/addField">
              <button className="px-6 py-2 bg-[#876454] text-white rounded-lg hover:bg-[#6f4e3e] mb-2">
                Add a new Field
              </button>
            </Link>
          </div>

          {/* Right Column - Changing Data */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Changing Data</h2>
            {/* Insert Data Button */}
            <Link to="/insertPage">
              <button className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition mb-2">
                Insert Data
              </button>
            </Link>

            {/* Update Data Button */}
            <Link to="/updatePage">
              <button className="px-8 py-3 bg-yellow-500 text-white text-lg font-semibold rounded-lg hover:bg-yellow-600 transition mb-2">
                Manage Data
              </button>
            </Link>
          </div>

          {/* Search Data Button */}
          <div className="col-span-2 flex flex-col items-center space-y-4">
            <Link to="/queryPage">
              <button className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition">
                Search Data
              </button>
            </Link>
            <Link to="/loggingPage">
              <button className="px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition">
                Change Log
              </button>
            </Link>
            <Link to="/helpPage">
              <button className="px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition">
                Help
              </button>
            </Link>
            <Link to="/userAccessControl">
              <button className="px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition">
                User Management
              </button>
            </Link>
          </div>
          <div className="col-span-2 flex justify-center mt-6 space-x-4">
          </div>
        </div>
      </div>

      {/* Popups */}
      <LoginRequiredPopup 
        isOpen={showLoginPopup} 
        onOpenChange={setShowLoginPopup} 
      />
      <PermissionDeniedPopup 
        isOpen={showPermissionPopup} 
        onOpenChange={setShowPermissionPopup} 
      />
      <NotInDatabasePopup 
        isOpen={showNotInDatabasePopup} 
        onOpenChange={setShowNotInDatabasePopup} 
      />
    </div>
  );
};

export default Home;
