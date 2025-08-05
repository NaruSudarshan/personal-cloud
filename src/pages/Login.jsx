function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-black">
      <div className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">Login</h2>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-2 border border-gray-700 rounded bg-gray-800 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-700 rounded bg-gray-800 text-white"
          />
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
