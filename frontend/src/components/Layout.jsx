// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import ZenoAI from "./ZenoAI";

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-background text-white flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Zeno AI Assistant */}
      {/* <ZenoAI /> */}
    </div>
  );
};

export default Layout;
