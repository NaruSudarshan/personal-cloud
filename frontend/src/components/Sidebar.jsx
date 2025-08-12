// src/components/Sidebar.jsx
import { FaCloudUploadAlt, FaFolderOpen, FaUsers } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-background text-white flex flex-col border-r border-orange-600">
      
      <nav className="flex flex-col p-4 gap-4 text-lg">
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-orange-800 transition ${
              isActive ? "bg-orange-700" : ""
            }`
          }
        >
          <FaCloudUploadAlt /> Upload
        </NavLink>
        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-orange-800 transition ${
              isActive ? "bg-orange-700" : ""
            }`
          }
        >
          <FaFolderOpen /> My Files
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-orange-800 transition ${
              isActive ? "bg-orange-700" : ""
            }`
          }
        >
          <FaUsers /> Users
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
