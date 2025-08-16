import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Files from "./pages/Files";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children, requireRoot = false }) => {
  const { isAuthenticated, isRoot, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireRoot && !isRoot()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page. Root access is required.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      {isAuthenticated() ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireRoot={true}><Users /></ProtectedRoute>} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
