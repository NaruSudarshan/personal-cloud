import { useEffect, useState } from "react";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
import axios from "axios";

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [versionsMap, setVersionsMap] = useState({});

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/files");
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
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
        const res = await axios.get(`http://localhost:5000/files/versions/${fileName}`);
        setVersionsMap((prev) => ({ ...prev, [fileName]: res.data }));
      } catch (err) {
        console.error("Error fetching versions:", err);
      }
    }
  };

  const handleDownload = (fileId) => {
    window.open(`http://localhost:5000/files/download/${fileId}`, "_blank");
  };

  const handleDelete = async (fileId, fileName) => {
    try {
      await axios.delete(`http://localhost:5000/files/${fileId}`);
      await fetchFiles();
      if (versionsMap[fileName]) fetchVersions(fileName);
    } catch (err) {
      console.error("Error deleting file:", err);
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
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-3xl font-bold mb-6 text-primary">My Files</h2>

      <div className="bg-foreground rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b border-orange-700 text-orange-400">
              <th className="p-4">File Name</th>
              <th className="p-4">Size</th>
              <th className="p-4">Uploaded At</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const showVersions = !!versionsMap[file.name];
              const versions = versionsMap[file.name] || [];

              return (
                <>
                  <tr key={file.id} className="hover:bg-gray-800">
                    <td className="p-4 font-semibold">{file.name}</td>
                    <td className="p-4">{file.size}</td>
                    <td className="p-4">{formatDate(file.uploadedAt)}</td>
                    <td className="p-4">v{file.version}</td>
                    <td className="p-4 text-right flex gap-4 justify-end">
                      <button
                        className={`px-3 py-1 rounded text-xs font-semibold transition 
                          ${showVersions ? "bg-orange-700 text-black hover:bg-orange-800" : "bg-orange-600 text-black hover:bg-orange-700"} mr-2`}
                        onClick={() => fetchVersions(file.name)}
                      >
                        {showVersions ? "Hide Versions" : "Show Versions"}
                      </button>
                      <button
                        className="text-green-400 hover:text-green-500"
                        onClick={() => handleDownload(file.id)}
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="text-red-400 hover:text-red-500"
                        onClick={() => handleDelete(file.id, file.name)}
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                  {showVersions &&
                    versions.map((v) => (
                      <tr key={v.id} className="bg-gray-900/50 border-t border-gray-700 hover:bg-gray-800">
                        <td className="p-4 pl-8 font-normal text-gray-300">
                          {file.name} - v{v.version}
                        </td>
                        <td className="p-4">{v.size}</td>
                        <td className="p-4">{formatDate(v.uploadedAt)}</td>
                        <td className="p-4">v{v.version}</td>
                        <td className="p-4 text-right flex gap-4 justify-end">
                          <button
                            className="text-green-400 hover:text-green-500"
                            onClick={() => handleDownload(v.id)}
                            title="Download"
                          >
                            <FaDownload />
                          </button>
                          <button
                            className="text-red-400 hover:text-red-500"
                            onClick={() => handleDelete(v.id, file.name)}
                            title="Delete"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}
          </tbody>
        </table>

        {files.length === 0 && (
          <div className="p-6 text-center text-gray-400">No files uploaded yet.</div>
        )}
      </div>
    </div>
  );
};

export default MyFiles;

