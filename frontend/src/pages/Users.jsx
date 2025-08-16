import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserPlus, FaTrashAlt, FaCopy, FaEye, FaEyeSlash, FaUsers, FaCalendarAlt, FaKey } from "react-icons/fa";

const Users = () => {
    const { token, API_BASE_URL } = useAuth();
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [expiryTime, setExpiryTime] = useState("");
    const [showPasswords, setShowPasswords] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch users');
            }
        } catch (error) {
            setError('Failed to fetch users');
        }
    };

    const handleCreateUser = async () => {
        if (!username || !expiryTime) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, expiryTime })
            });

            const data = await response.json();

            if (response.ok) {
                setUsers([data.user, ...users]);
                setUsername("");
                setExpiryTime("");
            } else {
                setError(data.error || 'Failed to create user');
            }
        } catch (error) {
            setError('Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setUsers(users.filter((user) => user.id !== userId));
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete user');
            }
        } catch (error) {
            setError('Failed to delete user');
        }
    };

    const handleCopyPassword = async (password) => {
        try {
            await navigator.clipboard.writeText(password);
            // You could add a toast notification here
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
        if (isExpired(user.expiryTime) || !user.isActive) return "text-red-400 bg-red-900/20";
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
                    <p className="text-gray-400 mt-1">Create and manage user accounts with access control</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{users.length} users</span>
                    <span>•</span>
                    <span>{users.filter(u => !isExpired(u.expiryTime)).length} active</span>
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
                        <h2 className="text-xl font-semibold text-white">Create New User</h2>
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
                            <span>User Accounts</span>
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
                                    users.forEach(user => allVisible[user.id] = true);
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
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                                    <FaUsers className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.username}</p>
                                                    <p className="text-sm text-gray-400">User Account</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords[user.id] ? "text" : "password"}
                                                        value={user.password}
                                                        readOnly
                                                        className="bg-gray-800 text-white font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        onClick={() => togglePasswordVisibility(user.id)}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                                    >
                                                        {showPasswords[user.id] ? <FaEyeSlash /> : <FaEye />}
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
                                            {user.role !== 'root' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaUsers className="text-gray-400 text-2xl" />
                                            </div>
                                            <p className="text-gray-400 text-lg">No users created yet</p>
                                            <p className="text-gray-500 text-sm mt-2">Create your first user account above</p>
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
                            <p className="text-2xl font-bold text-white">{users.filter(u => !isExpired(u.expiryTime)).length}</p>
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
                            <p className="text-2xl font-bold text-white">{users.filter(u => isExpired(u.expiryTime)).length}</p>
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
