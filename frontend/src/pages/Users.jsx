import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [expiryTime, setExpiryTime] = useState("");

    const generatePassword = () =>
        Math.random().toString(36).slice(-8) + "!A1"; // Simple strong-ish password

    const handleCreateUser = () => {
        if (!username || !expiryTime) return;

        const newUser = {
            id: uuidv4(),
            username,
            password: generatePassword(),
            expiryTime,
        };

        setUsers([...users, newUser]);
        setUsername("");
        setExpiryTime("");
    };

    const handleDeleteUser = (id) => {
        setUsers(users.filter((user) => user.id !== id));
    };

    const handleCopyPassword = (password) => {
        navigator.clipboard.writeText(password);
        alert("Password copied to clipboard!");
    };

    return (
        <div className="p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
                <div>
                    <label className="block mb-1 text-sm font-medium">Username</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">Expiry Date & Time</label>
                    <input
                        type="datetime-local"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                        required
                    />
                </div>

                <div>
                    <button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                        onClick={handleCreateUser}
                    >
                        Create User
                    </button>
                </div>
            </div>

            {/* User List */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-700 text-left">
                            <th className="p-2">Username</th>
                            <th className="p-2">Password</th>
                            <th className="p-2">Expiry</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-700">
                                <td className="p-2">{user.username}</td>
                                <td className="p-2 flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={user.password}
                                        readOnly
                                        className="bg-gray-800 text-white font-mono px-2 py-1 rounded cursor-pointer select-all"
                                        style={{ WebkitTextSecurity: "disc" }}
                                    />
                                    <button
                                        className="text-blue-400 hover:text-blue-600 text-sm"
                                        onClick={() => handleCopyPassword(user.password)}
                                    >
                                        Copy
                                    </button>
                                </td>
                                <td className="p-2">{user.expiryTime}</td>
                                <td className="p-2">
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center p-4 text-gray-400">
                                    No users created.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
