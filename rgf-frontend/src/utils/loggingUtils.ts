import { logChange } from "../api/logging";
import { useMsal } from "@azure/msal-react";
import { useUser } from "../components/handlers/UserContext";

// Set this to true to use a mock user for testing
const USE_MOCK_USER = false;

/**
 * Get the current user information from MSAL or emergency access
 * @returns Object with user email and name, or null if not logged in
 */
export const useCurrentUser = () => {
  // For testing purposes, return a mock user if USE_MOCK_USER is true
  if (USE_MOCK_USER) {
    console.log("Using mock user for testing");
    return {
      email: "test@example.com",
      name: "Test User"
    };
  }

  const { accounts } = useMsal();
  const { isEmergencyAccess } = useUser();

  // Check for emergency access first
  if (isEmergencyAccess) {
    return {
      email: "EmergencyAdminLogin",
      name: "EmergencyAdmin"
    };
  }
  
  // If not emergency access, check MSAL accounts
  if (accounts && accounts.length > 0) {
    return {
      email: accounts[0].username,
      name: accounts[0].name || accounts[0].username.split('@')[0]
    };
  }
  
  return null;
};

/**
 * Utility function to log changes with consistent error handling
 * @param action The action being performed (e.g., "Add Category", "Update Field")
 * @param changeDetails A description of the change
 * @param currentUser The current user object (from useCurrentUser hook)
 * @returns Promise that resolves when logging is complete
 */
export const logUserAction = async (
  action: string, 
  changeDetails: string, 
  currentUser: { email: string; name: string } | null
): Promise<void> => {
  if (currentUser && currentUser.email) {
    try {
      console.log(`Logging action: ${action} - ${changeDetails} for user: ${currentUser.email}`);
      await logChange(currentUser.email, action, changeDetails);
      console.log("Change logged successfully");
    } catch (logError) {
      console.error("Error logging change:", logError);
      // Don't throw the error to avoid disrupting the main flow
    }
  }
  else {
    console.log("No user logged in, Entry not logged");
  }
}; 