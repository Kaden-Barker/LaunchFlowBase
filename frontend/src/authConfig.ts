// src/authConfig.ts

// console.log("Loading MSAL configuration...");
// console.log("Client ID:", import.meta.env.VITE_MSAL_CLIENT_ID);
// console.log("Authority URL:", import.meta.env.VITE_MSAL_AUTHORITY_URL);


export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: import.meta.env.VITE_MSAL_AUTHORITY_URL,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "sessionStorage",  // You can change this to "localStorage" if needed
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        // Log all messages for debugging
        console.log(`MSAL Log Level ${level}:`, message);
      },
      piiLoggingEnabled: false,
      logLevel: 0 // Show all logs (0: errors, 1: warnings, 2: info, 3: verbose)
    }
  }
};
// console.log("MSAL Configuration:", msalConfig);
