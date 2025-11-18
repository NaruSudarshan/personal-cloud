// src/components/Sidebar.jsx
import { FaCloudUploadAlt, FaFolderOpen, FaUsers, FaHome, FaUser, FaSignOutAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-72 bg-foreground border-r border-gray-800 flex flex-col">
      {/* Logo/Brand Area */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <FaCloudUploadAlt className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Personal Cloud</h1>
            <p className="text-xs text-gray-400">AI-Powered Storage</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <FaHome className="text-lg" />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <FaCloudUploadAlt className="text-lg" />
          <span className="font-medium">Upload Files</span>
        </NavLink>

        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <FaFolderOpen className="text-lg" />
          <span className="font-medium">My Files</span>
        </NavLink>

        {/* Only show Users menu for root users */}
        {user?.role === 'root' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <FaUsers className="text-lg" />
            <span className="font-medium">Users</span>
          </NavLink>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <FaUser className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role === 'root' ? 'Administrator' : 'User'}
                {user?.email && ` • ${user.email}`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <FaSignOutAlt className="text-sm" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;