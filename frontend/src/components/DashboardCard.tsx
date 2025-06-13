import React from "react";
import { Link } from "react-router-dom";

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  to: string;
  accentColor?: string; // e.g. 'from-blue-500 to-blue-700'
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, to, accentColor = "from-blue-500 to-blue-700" }) => (
  <Link to={to} className="group">
    <div className={`relative flex flex-col items-center justify-center p-6 rounded-2xl shadow-xl bg-gradient-to-br ${accentColor} transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer min-h-[180px] min-w-[180px] max-w-xs border border-gray-700`}>
      <div className="mb-3 text-white text-4xl drop-shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-1 text-center drop-shadow-lg">{title}</h3>
      {description && <p className="text-gray-200 text-sm text-center">{description}</p>}
      <span className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-white text-lg">→</span>
    </div>
  </Link>
);

export default DashboardCard; 