// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      {/* Topbar at the top */}
      <Topbar />

      {/* Flex container for Sidebar + Page content */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
