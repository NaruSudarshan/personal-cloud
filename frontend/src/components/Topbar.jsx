// src/components/Topbar.jsx
const Topbar = () => {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-orange-700 text-white shadow-md">
      <h1 className="text-xl font-semibold">Personal Cloud</h1>
      <button className="bg-white text-orange-700 px-4 py-2 rounded hover:bg-orange-200 font-medium">
        Logout
      </button>
    </div>
  );
};

export default Topbar;
