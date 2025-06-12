// src/components/UserProfile.tsx
import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

const UserProfile: React.FC = () => {
  const { accounts, instance } = useMsal();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      setUserInfo(account);
    }
  }, [accounts]);

  const handleLogout = async () => {
    try {
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear MSAL cache
      await instance.clearCache();
      
      // Reload the page to reset the application state
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return userInfo ? (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ 
          padding: '10px 20px', 
          cursor: 'pointer',
          backgroundColor: 'transparent',
          color: 'white',
          border: '2px solid white',
          borderRadius: '4px',
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <h3>{userInfo.username}</h3>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <p>Loading user info...</p>
  );
};

export default UserProfile;
