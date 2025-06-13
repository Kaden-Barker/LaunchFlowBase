import React from "react";

const Logo = ({ className = "" }) => (
  <img
    src="/LaunchFlowLogo.png" // Update this path if needed
    alt="LaunchFlow Logo"
    className={`w-20 h-20 object-contain drop-shadow-lg ${className}`}
    style={{ filter: "drop-shadow(0 0 8px #1e293b)" }}
  />
);

export default Logo; 