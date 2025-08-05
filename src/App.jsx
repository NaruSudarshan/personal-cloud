import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <div className="flex">
          <div className="flex-1 p-6 bg-[#0f0f0f] min-h-screen text-white">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/files" element={<Files />} />
              <Route path="/users" element={<Users />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
