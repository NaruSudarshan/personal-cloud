import { useEffect, useState } from "react";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
import axios from "axios";

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [versionsMap, setVersionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔍 New states for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/files");
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (fileName) => {
    if (versionsMap[fileName]) {
      setVersionsMap((prev) => {
        const newMap = { ...prev };
        delete newMap[fileName];
        return newMap;
      });
    } else {
      try {
        const res = await axios.get(`http://localhost:5000/api/files/versions/${fileName}`);
        setVersionsMap((prev) => ({ ...prev, [fileName]: res.data }));
      } catch (err) {
        console.error("Error fetching versions:", err);
      }
    }
  };

  const handleDownload = (fileId) => {
    window.open(`http://localhost:5000/api/files/download/${fileId}`, "_blank");
  };

  const handleDelete = async (fileId, fileName) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      try {
        await axios.delete(`http://localhost:5000/api/files/${fileId}`);
        fetchFiles();
        if (versionsMap[fileName]) {
          const res = await axios.get(`http://localhost:5000/api/files/versions/${fileName}`);
          setVersionsMap((prev) => ({ ...prev, [fileName]: res.data }));
        }
      } catch (err) {
        console.error("Error deleting file:", err);
        alert("Failed to delete file.");
      }
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  };

  // 🔍 Search API call
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-3xl font-bold mb-6 text-primary">My Files</h2>

      {/* 🔍 Search Bar */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Powered by AI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white flex-1"
        />
        <button
          onClick={handleSearch}
          className="bg-orange-600 px-4 py-2 rounded text-black font-semibold"
        >
          Search
        </button>
      </div>

      {/* 🔍 Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8 bg-gray-900 p-4 rounded">
          <h3 className="text-xl font-bold mb-4">Search Results</h3>
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-orange-700 text-orange-400">
                <th className="p-4">File Name</th>
                <th className="p-4">Score</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((result) => (
                <tr key={result.file._id} className="hover:bg-gray-800">
                  <td className="p-4 font-semibold">{result.file.originalName}</td>
                  <td className="p-4">{result.score.toFixed(3)}</td>
                  <td className="p-4 flex gap-4">
                    <button
                      className="text-green-400 hover:text-green-500"
                      onClick={() => handleDownload(result.file._id)}
                    >
                      <FaDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Existing File List */}
      <div className="bg-foreground rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b border-orange-700 text-orange-400">
              <th className="p-4">File Name</th>
              <th className="p-4">Uploaded By</th>
              <th className="p-4">Size</th>
              <th className="p-4">Uploaded At</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.flatMap((file) => {
              const showVersions = !!versionsMap[file.name];
              const versions = versionsMap[file.name] || [];

              const mainRow = (
                <tr key={file.id} className="hover:bg-gray-800">
                  <td className="p-4 font-semibold">{file.name}</td>
                  <td className="p-4">{file.uploadedBy}</td>
                  <td className="p-4">{file.size}</td>
                  <td className="p-4">{formatDate(file.uploadedAt)}</td>
                  <td className="p-4">v{file.version}</td>
                  <td className="p-4 text-right flex gap-4 justify-end">
                    <button
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${showVersions ? "bg-orange-700 text-black" : "bg-orange-600 text-black"}`}
                      onClick={() => fetchVersions(file.name)}
                    >
                      {showVersions ? "Hide" : "Versions"}
                    </button>
                    <button className="text-green-400 hover:text-green-500" onClick={() => handleDownload(file.id)} title="Download"><FaDownload /></button>
                    <button className="text-red-400 hover:text-red-500" onClick={() => handleDelete(file.id, file.name)} title="Delete"><FaTrashAlt /></button>
                  </td>
                </tr>
              );

              const versionRows = showVersions ? versions.slice(1).map((v) => (
                <tr key={v.id} className="bg-gray-900/50 border-t border-gray-700">
                  <td className="p-4 pl-8 text-gray-300">└─ v{v.version}</td>
                  <td className="p-4"></td>
                  <td className="p-4">{v.size}</td>
                  <td className="p-4">{formatDate(v.uploadedAt)}</td>
                  <td className="p-4">v{v.version}</td>
                  <td className="p-4 text-right flex gap-4 justify-end">
                    <button className="text-green-400 hover:text-green-500" onClick={() => handleDownload(v.id)} title="Download"><FaDownload /></button>
                    <button className="text-red-400 hover:text-red-500" onClick={() => handleDelete(v.id, file.name)} title="Delete"><FaTrashAlt /></button>
                  </td>
                </tr>
              )) : [];

              return [mainRow, ...versionRows];
            })}
          </tbody>
        </table>
        {files.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-400">No files uploaded yet.</div>
        )}
        {loading && (
          <div className="p-6 text-center text-gray-400">Loading files...</div>
        )}
      </div>
    </div>
  );
};

export default MyFiles;
