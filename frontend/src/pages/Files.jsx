import { useEffect, useState } from "react";
import { FaDownload, FaTrashAlt, FaRobot } from "react-icons/fa";
import axios from "axios";

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [versionsMap, setVersionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(""); // State for AI-generated answer

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setAiAnswer(""); // Clear previous answer
      return;
    }
    
    setSearching(true);
    setAiAnswer(""); // Clear previous answer
    setSearchResults([]); // Clear previous results
    
    try {
      const res = await axios.post('http://localhost:5000/api/query', { query: searchQuery });
      
      // Set the AI answer and search results
      setAiAnswer(res.data.answer);
      setSearchResults(res.data.sources);
    } catch (err) {
      console.error("Search error:", err);
      setAiAnswer("❌ Failed to get answer. Please try again.");
      setSearchResults([]);
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

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ask anything about your files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-3 rounded bg-gray-800 text-white flex-1 border border-gray-700 focus:border-orange-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className={`bg-orange-600 px-4 py-2 rounded text-white font-semibold flex items-center ${
            searching ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-700"
          }`}
        >
          {searching ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </span>
          ) : (
            <span className="flex items-center">
              <FaRobot className="mr-2" />
              Ask AI
            </span>
          )}
        </button>
      </div>

      {/* AI Answer Display */}
      {aiAnswer && (
        <div className="mb-6 bg-gray-900 rounded-lg p-5 border border-gray-700">
          <div className="flex items-start">
            <div className="bg-orange-600 p-2 rounded-full mr-3">
              <FaRobot className="text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-orange-400 mb-2">AI Answer:</h3>
              <div className="prose prose-invert max-w-none">
                {aiAnswer.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-orange-400">Relevant Sources</h3>
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-orange-700 text-gray-400">
                <th className="p-3">File Name</th>
                <th className="p-3">Score</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((result) => (
                <tr key={result.chunkId} className="hover:bg-gray-800">
                  <td className="p-3 font-semibold">{result.name} <span className="text-xs text-gray-500">v{result.version}</span></td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <span className="mr-2">{result.score.toFixed(3)}</span>
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, result.score * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      className="text-green-400 hover:text-green-500 flex items-center text-sm"
                      onClick={() => handleDownload(result.fileId)}
                    >
                      <FaDownload className="mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File List */}
      <div className="bg-gray-900 rounded-lg shadow overflow-x-auto border border-gray-700">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b border-orange-700 text-gray-400">
              <th className="p-3">File Name</th>
              <th className="p-3">Uploaded By</th>
              <th className="p-3">Size</th>
              <th className="p-3">Uploaded At</th>
              <th className="p-3">Version</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.flatMap((file) => {
              const showVersions = !!versionsMap[file.name];
              const versions = versionsMap[file.name] || [];

              const mainRow = (
                <tr key={file.id} className="hover:bg-gray-800">
                  <td className="p-3 font-semibold">{file.name}</td>
                  <td className="p-3">{file.uploadedBy}</td>
                  <td className="p-3">{file.size}</td>
                  <td className="p-3">{formatDate(file.uploadedAt)}</td>
                  <td className="p-3">v{file.version}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          showVersions 
                            ? "bg-orange-700 text-white" 
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                        onClick={() => fetchVersions(file.name)}
                      >
                        {showVersions ? "Hide" : "Versions"}
                      </button>
                      <button 
                        className="text-green-400 hover:text-green-500 px-2 py-1 rounded hover:bg-gray-800"
                        onClick={() => handleDownload(file.id)} 
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-800"
                        onClick={() => handleDelete(file.id, file.name)} 
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              );

              const versionRows = showVersions ? versions.slice(1).map((v) => (
                <tr key={v.id} className="bg-gray-800 border-t border-gray-700">
                  <td className="p-3 pl-8 text-gray-300">└─ v{v.version}</td>
                  <td className="p-3"></td>
                  <td className="p-3">{v.size}</td>
                  <td className="p-3">{formatDate(v.uploadedAt)}</td>
                  <td className="p-3">v{v.version}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button 
                        className="text-green-400 hover:text-green-500 px-2 py-1 rounded hover:bg-gray-700"
                        onClick={() => handleDownload(v.id)} 
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-700"
                        onClick={() => handleDelete(v.id, file.name)} 
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
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