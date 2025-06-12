import { StrictMode } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';  // Import React Router components
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import './index.css';
import Home from './landingPages/home.tsx';
import AddCategory from './landingPages/addCategory.tsx';
import AddAssetType from './landingPages/addAssetType.tsx';
import AddField from './landingPages/addField.tsx';
import QueryPage from './landingPages/queryPage.tsx';
import InsertPage from './landingPages/insertPage.tsx';
import ManageDataPage from './landingPages/manageDataPage.tsx';
import LoggingPage from './landingPages/loggingPage.tsx';
import UserAccessControl from './landingPages/users.tsx';
import HelpPage from './helpPages/helpPage.tsx';
import HelpEditingTables from './helpPages/helpEditingTables.tsx';
import HelpInsertingData from './helpPages/helpInsertingData.tsx';
import HelpSearchingData from './helpPages/helpSearchingData.tsx';
import HelpManagingData from './helpPages/helpManagingData.tsx';
import HelpChangeLog from './helpPages/helpChangeLog.tsx';
import HelpManagingUsers from './helpPages/helpManagingUsers.tsx';
import EmergencyLogin from './emergencyLogin.tsx';
import { ProtectedRoute } from './components/permissions/ProtectedRoute.tsx';
import { UserProvider } from './components/handlers/UserContext.tsx';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Add path handling component
const PathHandler = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('path');
    if (path) {
      navigate(path);
    }
  }, [navigate]);

  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <UserProvider>
        <Router>  {/* Wrap the entire application with Router */}
          <PathHandler />
          <Routes>  {/* Define the routes */}
            <Route path="/" element={<Home />} />  {/* Home page route */}
            <Route path="/emergency/login/for/when/something/goes/wrong" element={<EmergencyLogin />} />
            <Route path="/addCategory" element={
              <ProtectedRoute requiredPermission="manage_categories">
                <AddCategory />
              </ProtectedRoute>
            } />  {/* AddCategory page route */}
            <Route path="/addAssetType" element={
              <ProtectedRoute requiredPermission="manage_asset_types">
                <AddAssetType />
              </ProtectedRoute>
            } />  {/* AddAssetType page route */}
            <Route path="/AddField" element={
              <ProtectedRoute requiredPermission="manage_fields">
                <AddField />
              </ProtectedRoute>
            } />  {/* AddField page route */}
            <Route path="/QueryPage" element={
              <ProtectedRoute>
                <QueryPage />
              </ProtectedRoute>
            } />  {/* Query page route */}
            <Route path='/InsertPage' element={
              <ProtectedRoute requiredPermission="insert_data">
                <InsertPage />
              </ProtectedRoute>
            } /> {/* Insert page route */}
            <Route path='/updatePage' element={
              <ProtectedRoute requiredPermission={["update_data", "delete_data"]}>
                <ManageDataPage />
              </ProtectedRoute>
            } /> {/* Update page route */}
            <Route path='/loggingPage' element={
              <ProtectedRoute requiredPermission="view_logs">
                <LoggingPage />
              </ProtectedRoute>
            } /> {/* Logging page route */}
            <Route path='/userAccessControl' element={
              <ProtectedRoute requiredPermission="manage_users">
                <UserAccessControl />
              </ProtectedRoute>
            } /> {/* User Access Control page route */}
            <Route path='/helpPage' element={<HelpPage />} /> {/* Help page route */}
            <Route path='/helpEditingTables' element={<HelpEditingTables />} />
            <Route path='/helpInsertingData' element={<HelpInsertingData />} />
            <Route path='/helpSearchingData' element={<HelpSearchingData />} />
            <Route path='/helpManagingData' element={<HelpManagingData />} />
            <Route path='/helpChangeLog' element={<HelpChangeLog />} />
            <Route path='/helpManagingUsers' element={<HelpManagingUsers />} />
          </Routes>
        </Router>
      </UserProvider>
    </MsalProvider>
  </StrictMode>
);
