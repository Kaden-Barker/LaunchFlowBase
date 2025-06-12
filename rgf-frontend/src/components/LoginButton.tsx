import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { InteractionStatus } from "@azure/msal-browser";

const LoginButton: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const handleLogin = async () => {
    if (inProgress === InteractionStatus.None) {
      try {
        console.log("Logging in...");
        await instance.loginRedirect({
          scopes: ["openid", "profile", "User.Read"],
          prompt: "select_account"
        });
        console.log("Logged in!");
      } catch (error) {
        console.error("Login error:", error);
      }
    }
  };

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      setUserEmail(account.username);
      setUserName(account.name || account.username.split('@')[0]);
    }
  }, [accounts]);

  if (inProgress === InteractionStatus.Startup || 
      inProgress === InteractionStatus.HandleRedirect) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {userEmail ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <span>Welcome, {userName}</span>
          <span style={{ color: '#666' }}>({userEmail})</span>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
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
          Login
        </button>
      )}
    </div>
  );
};

export default LoginButton;