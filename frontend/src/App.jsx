import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Files from "./pages/Files";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";

function App() {
  const isLoggedIn = true; // Replace with actual auth logic later

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/files" element={<Files />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
