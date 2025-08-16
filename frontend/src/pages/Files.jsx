import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaDownload, FaTrashAlt, FaRobot, FaSearch, FaFileAlt, FaClock, FaStar, FaFilter, FaSort } from "react-icons/fa";
import axios from "axios";

const MyFiles = () => {
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [versionsMap, setVersionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/files", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
        const res = await axios.get(`http://localhost:5000/api/files/versions/${fileName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setVersionsMap((prev) => ({ ...prev, [fileName]: res.data }));
      } catch (err) {
        console.error("Error fetching versions:", err);
      }
    }
  };

  const handleDownload = (fileId) => {
    const url = `http://localhost:5000/api/files/download/${fileId}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (fileId, fileName) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      try {
        await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchFiles();
        if (versionsMap[fileName]) {
          const res = await axios.get(`http://localhost:5000/api/files/versions/${fileName}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
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
      setAiAnswer("");
      setShowSearchResults(false);
      return;
    }
    
    setSearching(true);
    setAiAnswer("");
    setSearchResults([]);
    setShowSearchResults(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/query', { query: searchQuery }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Files</h1>
          <p className="text-gray-400 mt-1">Manage and search through your uploaded files</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FaFilter className="text-gray-400" />
            <span className="text-white">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FaSort className="text-gray-400" />
            <span className="text-white">Sort</span>
          </button>
        </div>
      </div>

      {/* AI Search Section */}
      <div className="bg-foreground rounded-xl border border-gray-800 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <FaRobot className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI-Powered Search</h2>
            <p className="text-gray-400 text-sm">Ask questions about your files using natural language</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ask anything about your files... (e.g., 'Show me all PDF files about project management')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className={`px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg flex items-center space-x-2 transition-all duration-200 ${
              searching ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:scale-105"
            }`}
          >
            {searching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <FaRobot />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Answer Display */}
        {aiAnswer && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <FaRobot className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary mb-3">AI Response</h3>
                <div className="prose prose-invert max-w-none">
                  {aiAnswer.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0 text-gray-300 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FaStar className="text-primary" />
                <span>Relevant Sources ({searchResults.length})</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={result.chunkId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <FaFileAlt className="text-white text-sm" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{result.name}</p>
                        <p className="text-sm text-gray-400">Version {result.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Relevance:</span>
                        <div className="w-16 bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, result.score * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-300">{result.score.toFixed(3)}</span>
                      </div>
                      <button
                        className="text-primary hover:text-secondary flex items-center space-x-1 text-sm font-medium transition-colors"
                        onClick={() => handleDownload(result.fileId)}
                      >
                        <FaDownload />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Management Section */}
      <div className="bg-foreground rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">File Management</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{files.length} files</span>
              <span>•</span>
              <span>2.3 GB total</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-foreground z-10">
                <tr className="border-b border-gray-800">
                  <th className="text-left p-3 text-gray-400 font-medium">File Name</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Uploaded By</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Size</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Uploaded At</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Version</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.flatMap((file) => {
                  const showVersions = !!versionsMap[file.name];
                  const versions = versionsMap[file.name] || [];

                  const mainRow = (
                    <tr key={file.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                            <FaFileAlt className="text-gray-400 text-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">File</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-300 text-sm truncate block max-w-32">{file.uploadedBy}</span>
                      </td>
                      <td className="p-3 text-gray-300 text-sm">{file.size}</td>
                      <td className="p-3 text-gray-300 text-sm">{formatDate(file.uploadedAt)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">v{file.version}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              showVersions 
                                ? "bg-primary text-white" 
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                            onClick={() => fetchVersions(file.name)}
                          >
                            {showVersions ? "Hide" : "Versions"}
                          </button>
                          <button 
                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
                            onClick={() => handleDownload(file.id)} 
                            title="Download"
                          >
                            <FaDownload className="text-sm" />
                          </button>
                          <button 
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                            onClick={() => handleDelete(file.id, file.name)} 
                            title="Delete"
                          >
                            <FaTrashAlt className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );

                  const versionRows = showVersions ? versions.slice(1).map((v) => (
                    <tr key={v.id} className="border-b border-gray-800 bg-gray-800/50">
                      <td className="p-3 pl-10">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
                            <FaFileAlt className="text-gray-400 text-xs" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-300 text-sm truncate">└─ v{v.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3 text-gray-400 text-xs">{v.size}</td>
                      <td className="p-3 text-gray-400 text-xs">{formatDate(v.uploadedAt)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">v{v.version}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
                            onClick={() => handleDownload(v.id)} 
                            title="Download"
                          >
                            <FaDownload className="text-sm" />
                          </button>
                          <button 
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                            onClick={() => handleDelete(v.id, file.name)} 
                            title="Delete"
                          >
                            <FaTrashAlt className="text-sm" />
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
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaFileAlt className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-400 text-lg">No files uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload your first file to get started</p>
              </div>
            )}
            
            {loading && (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading files...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFiles;