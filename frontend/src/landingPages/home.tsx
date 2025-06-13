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
import Logo from "../components/Logo";
import DashboardCard from "../components/DashboardCard";
import {
  Database,
  Layers,
  Columns,
  Upload,
  Settings,
  Search,
  History,
  HelpCircle,
  Users,
} from "lucide-react";

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
    <div className="flex flex-col min-h-screen w-screen bg-gradient-to-br from-[#181A20] to-[#23272F] text-gray-100 font-sans">
      {/* Header Bar */}
      <header className="relative bg-transparent text-white py-8 mb-2">
        <div className="flex flex-col items-center justify-center gap-2">
          <Logo className="w-28 h-28 mb-2" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight text-blue-400 drop-shadow-lg">
            LaunchFlow
          </h1>
          <p className="text-lg text-gray-300 font-medium mt-2 text-center max-w-xl">
            Your Data, Beautifully Managed
          </p>
          {/* Mobile Login/Profile */}
          <div className="flex md:hidden justify-center items-center mt-4">
            {accounts.length > 0 ? <UserProfile /> : <LoginButton />}
          </div>
        </div>
        {/* Nav & Profile (Desktop only) */}
        <div className="hidden md:flex flex-row items-center gap-4 absolute right-4 top-4 z-20">
          {accounts.length > 0 ? <UserProfile /> : <LoginButton />}
          <HamburgerNav />
        </div>
        {/* Hamburger Nav (Mobile only) */}
        <div className="md:hidden absolute right-4 top-4">
          <HamburgerNav />
        </div>
      </header>
      {/* Modern Dashboard Cards */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          <DashboardCard
            icon={<Database size={36} />}
            title="Add Category"
            description="Create a new data category."
            to="/addCategory"
            accentColor="from-blue-600 to-blue-800"
          />
          <DashboardCard
            icon={<Layers size={36} />}
            title="Add Group"
            description="Add a new asset group/type."
            to="/addAssetType"
            accentColor="from-green-600 to-green-800"
          />
          <DashboardCard
            icon={<Columns size={36} />}
            title="Add Field"
            description="Add a new field to your data."
            to="/addField"
            accentColor="from-purple-600 to-purple-800"
          />
          <DashboardCard
            icon={<Upload size={36} />}
            title="Insert Data"
            description="Add new data entries."
            to="/insertPage"
            accentColor="from-cyan-600 to-cyan-800"
          />
          <DashboardCard
            icon={<Settings size={36} />}
            title="Manage Data"
            description="Update or delete existing data."
            to="/updatePage"
            accentColor="from-yellow-500 to-yellow-700"
          />
          <DashboardCard
            icon={<Search size={36} />}
            title="Search Data"
            description="Query and explore your data."
            to="/queryPage"
            accentColor="from-pink-600 to-pink-800"
          />
          <DashboardCard
            icon={<History size={36} />}
            title="Change Log"
            description="View all changes and logs."
            to="/loggingPage"
            accentColor="from-indigo-600 to-indigo-800"
          />
          <DashboardCard
            icon={<HelpCircle size={36} />}
            title="Help"
            description="Get help and documentation."
            to="/helpPage"
            accentColor="from-fuchsia-600 to-fuchsia-800"
          />
          <DashboardCard
            icon={<Users size={36} />}
            title="User Management"
            description="Manage users and permissions."
            to="/userAccessControl"
            accentColor="from-teal-600 to-teal-800"
          />
        </div>
      </main>
      {/* Popups */}
      <LoginRequiredPopup isOpen={showLoginPopup} onOpenChange={setShowLoginPopup} />
      <PermissionDeniedPopup isOpen={showPermissionPopup} onOpenChange={setShowPermissionPopup} />
      <NotInDatabasePopup isOpen={showNotInDatabasePopup} onOpenChange={setShowNotInDatabasePopup} />
    </div>
  );
};

export default Home;
