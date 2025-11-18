import { useState } from "react";
import { FaCloudUploadAlt, FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import api from "../lib/api";
import { API_BASE_URL } from "../lib/config";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo(null);

    try {
      const endpoint = `${API_BASE_URL}/auth/signup`;
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim()
      };

      const response = await api.post('/auth/signup', payload);

      if (response.status === 201) {
        window.location.href = '/login?message=signup_success';
        return;
      }

      setError(response.data?.error || 'Unexpected signup response. Please try again.');
      setDebugInfo({
        endpoint,
        payload: { username: payload.username, email: payload.email, name: payload.name },
        status: response.status,
        message: response.data?.message,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Signup error:', err);
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error || err.response?.data?.message;
      setError(serverMessage || 'Failed to create account. Please try again.');
      setDebugInfo({
        endpoint: `${API_BASE_URL}/auth/signup`,
        status,
        statusText: err.response?.statusText,
        serverMessage,
        networkError: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaCloudUploadAlt className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">OneVault</h1>
          <p className="text-gray-400">Create Your Root Account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-foreground rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Set up your root user account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="How should we address you?"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Root Account"}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:text-secondary transition-colors">
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>

        {debugInfo && (
          <div className="mt-4 bg-gray-900/60 border border-gray-700 rounded-xl p-4 text-xs text-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white">Debug details</span>
              <button
                type="button"
                onClick={() => setDebugInfo(null)}
                className="text-primary hover:text-secondary transition-colors"
              >
                Clear
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <FaUser className="text-white text-xs" />
            </div>
            <div>
              <p className="text-blue-300 text-sm">
                <strong>Root Account:</strong> This will create your main administrator account with full access to manage files and create temporary users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;