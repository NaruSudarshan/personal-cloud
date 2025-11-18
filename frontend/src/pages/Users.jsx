import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserPlus, FaTrashAlt, FaCopy, FaEye, FaEyeSlash, FaUsers, FaCalendarAlt, FaKey } from "react-icons/fa";
import axios from "axios";

const Users = () => {
    const { user, API_BASE_URL } = useAuth();
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [expiryTime, setExpiryTime] = useState("");
    const [showPasswords, setShowPasswords] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Only root users can access this page
    if (user?.role !== 'root') {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaKey className="text-white text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">Only root users can access user management.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/users`, {
                withCredentials: true
            });
            setUsers(response.data.users.filter(user => user.role !== 'root'));
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to fetch users');
        }
    };

    const handleCreateUser = async () => {
        if (!username || !expiryTime) return;

        setLoading(true);
        setError("");

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/users`, 
                    { username, expiryTime }, 
                    { withCredentials: true }
                );
                // Normalize returned user to include `_id` since backend returns `id` for created user
                const created = response.data.user || {};
                if (created.id && !created._id) created._id = created.id;
                setUsers([created, ...users]);
            setUsername("");
            setExpiryTime("");
        } catch (error) {
            console.error('Failed to create user:', error);
            setError(error.response?.data?.error || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!userId) {
            setError("Invalid user ID");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/auth/users/${userId}`, {
                withCredentials: true
            });
            setUsers(users.filter((user) => user._id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
            setError(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleCopyPassword = async (password) => {
        try {
            await navigator.clipboard.writeText(password);
        } catch (err) {
            console.error("Failed to copy password:", err);
        }
    };

    const togglePasswordVisibility = (userId) => {
        setShowPasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const isExpired = (expiryTime) => {
        return new Date(expiryTime) < new Date();
    };

    const getStatusColor = (user) => {
        if (isExpired(user.expiryTime)) return "text-red-400 bg-red-900/20";
        if (!user.isActive) return "text-yellow-400 bg-yellow-900/20";
        return "text-green-400 bg-green-900/20";
    };

    const getStatusText = (user) => {
        if (!user.isActive) return "Inactive";
        if (isExpired(user.expiryTime)) return "Expired";
        return "Active";
    };

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">Create and manage temporary user accounts</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{users.length} users</span>
                    <span>•</span>
                    <span>{users.filter(u => u.isActive && !isExpired(u.expiryTime)).length} active</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                </div>
            )}

            {/* Create User Form */}
            <div className="bg-foreground rounded-xl border border-gray-800 p-6 mb-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <FaUserPlus className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Create Temporary User</h2>
                        <p className="text-gray-400 text-sm">Add a new user with temporary access</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date & Time</label>
                        <input
                            type="datetime-local"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleCreateUser}
                        >
                            <FaUserPlus />
                            <span>{loading ? "Creating..." : "Create User"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 bg-foreground rounded-xl border border-gray-800 flex flex-col min-h-0">
                <div className="p-6 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                            <FaUsers />
                            <span>Temporary Users</span>
                        </h2>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Show passwords:</span>
                            <button
                                onClick={() => setShowPasswords({})}
                                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Hide All
                            </button>
                            <button
                                onClick={() => {
                                    const allVisible = {};
                                    users.forEach(user => allVisible[user._id] = true);
                                    setShowPasswords(allVisible);
                                }}
                                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Show All
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-foreground z-10">
                                <tr className="border-b border-gray-800">
                                    <th className="text-left p-4 text-gray-400 font-medium">User</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Password</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Expires</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Created</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                                    <FaUsers className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.username}</p>
                                                    <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords[user._id] ? "text" : "password"}
                                                        value={user.password}
                                                        readOnly
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        onClick={() => togglePasswordVisibility(user._id)}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                                    >
                                                        {showPasswords[user._id] ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleCopyPassword(user.password)}
                                                    className="p-2 text-primary hover:text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Copy password"
                                                >
                                                    <FaCopy />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                                                {getStatusText(user)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <FaCalendarAlt className="text-gray-400 text-sm" />
                                                <span className="text-gray-300">{formatDate(user.expiryTime)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-400 text-sm">{formatDate(user.createdAt)}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Delete user"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaUsers className="text-gray-400 text-2xl" />
                                            </div>
                                            <p className="text-gray-400 text-lg">No temporary users created yet</p>
                                            <p className="text-gray-500 text-sm mt-2">Create your first temporary user account above</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-foreground rounded-xl border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FaUsers className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-foreground rounded-xl border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold text-white">
                                {users.filter(u => u.isActive && !isExpired(u.expiryTime)).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <FaKey className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-foreground rounded-xl border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Expired Users</p>
                            <p className="text-2xl font-bold text-white">
                                {users.filter(u => isExpired(u.expiryTime)).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                            <FaCalendarAlt className="text-white text-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Users;