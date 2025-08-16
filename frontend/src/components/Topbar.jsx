import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Topbar = () => {
  const { user, logout } = useAuth();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  };

  return (
    <div className="bg-foreground border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Empty for now */}
        <div></div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <FaUser className="text-white text-sm" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role} • Expires {formatDate(user?.expiryTime)}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <FaSignOutAlt className="text-sm" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;