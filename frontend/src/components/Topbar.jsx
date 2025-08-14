import { FaUser } from "react-icons/fa";

const Topbar = () => {
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
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>

          {/* Logout Button */}
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;