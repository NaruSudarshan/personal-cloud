import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Layout from "../components/Layout";

const Dashboard = () => {
  return (
    <Layout>
    <div className="flex min-h-screen bg-background text-white">
      
        <main className="flex-1 p-6">
          <h2 className="text-3xl font-bold mb-4 text-primary">Welcome back!</h2>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-foreground p-4 rounded shadow">
              <p className="text-sm text-gray-400">Storage Used</p>
              <p className="text-2xl font-semibold text-primary">2.3 GB</p>
            </div>
            <div className="bg-foreground p-4 rounded shadow">
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-semibold text-primary">1</p>
            </div>
            <div className="bg-foreground p-4 rounded shadow">
              <p className="text-sm text-gray-400">Total Files</p>
              <p className="text-2xl font-semibold text-primary">36</p>
            </div>
          </div>

          {/* Recent Files Placeholder */}
          <div className="bg-foreground p-4 rounded shadow">
            <p className="text-lg font-semibold text-primary mb-2">Recent Files</p>
            <p className="text-gray-400 text-sm">Coming soon...</p>
          </div>
        </main>
      </div>
  </Layout>
  );
};

export default Dashboard;
