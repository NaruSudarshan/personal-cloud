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


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { FaDownload, FaTrash } from 'react-icons/fa';

// const Files = () => {
//   const [files, setFiles] = useState([]);
//   const [fileVersions, setFileVersions] = useState({});
//   const [showVersions, setShowVersions] = useState({});

//   useEffect(() => {
//     fetchFiles();
//   }, []);

//   const fetchFiles = async () => {
//     const res = await axios.get('http://localhost:5000/files');
//     setFiles(res.data);
//   };

//   const handleDelete = async (id) => {
//     await axios.delete(`http://localhost:5000/files/${id}`);
//     fetchFiles();
//   };

//   const toggleVersions = async (originalName) => {
//     const currentState = showVersions[originalName];
//     setShowVersions({ ...showVersions, [originalName]: !currentState });

//     if (!currentState && !fileVersions[originalName]) {
//       const res = await axios.get(`http://localhost:5000/files/versions/${originalName}`);
//       setFileVersions({ ...fileVersions, [originalName]: res.data });
//     }
//   };

//   const latestVersionMap = {};
//   files.forEach(file => {
//     if (
//       !latestVersionMap[file.originalName] ||
//       file.version > latestVersionMap[file.originalName].version
//     ) {
//       latestVersionMap[file.originalName] = file;
//     }
//   });

//   return (
//     <div className="p-8">
//       <h2 className="text-2xl font-bold mb-6 text-white">My Files</h2>

//       <div className="grid grid-cols-12 font-semibold text-gray-400 border-b border-gray-600 pb-2 mb-4 text-sm">
//         <div className="col-span-4">File Name</div>
//         <div className="col-span-2">Size</div>
//         <div className="col-span-2">Uploaded At</div>
//         <div className="col-span-1 text-center">Version</div>
//         <div className="col-span-3 text-right">Actions</div>
//       </div>

//       {Object.keys(latestVersionMap).map((originalName) => {
//         const file = latestVersionMap[originalName];
//         return (
//           <div key={file._id} className="mb-2">
//             {!showVersions[originalName] && (
//               <div className="grid grid-cols-12 items-center text-white bg-gray-800 p-3 rounded-md">
//                 <div className="col-span-4 truncate">{file.originalName}</div>
//                 <div className="col-span-2">{(file.size / 1024).toFixed(1)} KB</div>
//                 <div className="col-span-2">{new Date(file.uploadedAt).toLocaleDateString()}</div>
//                 <div className="col-span-1 text-center">v{file.version}</div>
//                 <div className="col-span-3 flex justify-end space-x-2">
//                   <a
//                     href={`http://localhost:5000/uploads/${file.storedName}`}
//                     download
//                     className="text-green-400 hover:text-green-600"
//                   >
//                     <FaDownload />
//                   </a>
//                   <FaTrash
//                     className="text-red-400 hover:text-red-600 cursor-pointer"
//                     onClick={() => handleDelete(file._id)}
//                   />
//                   <button
//                     className="text-blue-400 hover:text-blue-600 text-sm underline ml-2"
//                     onClick={() => toggleVersions(file.originalName)}
//                   >
//                     Show Versions
//                   </button>
//                 </div>
//               </div>
//             )}

//             {showVersions[originalName] && (
//               <div className="bg-gray-900 p-3 rounded-md mt-2">
//                 <div className="flex justify-between items-center mb-2">
//                   <h3 className="text-lg font-semibold text-white">{file.originalName} - All Versions</h3>
//                   <button
//                     className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
//                     onClick={() => toggleVersions(file.originalName)}
//                   >
//                     Hide Versions
//                   </button>
//                 </div>
//                 {fileVersions[originalName]?.map((version) => (
//                   <div
//                     key={version._id}
//                     className="grid grid-cols-12 items-center bg-gray-800 text-white text-sm rounded-md mb-2 px-3 py-2 border-l-4 border-blue-400"
//                   >
//                     <div className="col-span-4 truncate">{version.originalName}</div>
//                     <div className="col-span-2">{(version.size / 1024).toFixed(1)} KB</div>
//                     <div className="col-span-2">{new Date(version.uploadedAt).toLocaleDateString()}</div>
//                     <div className="col-span-1 text-center">v{version.version}</div>
//                     <div className="col-span-3 flex justify-end space-x-2">
//                       <a
//                         href={`http://localhost:5000/uploads/${version.storedName}`}
//                         download
//                         className="text-green-400 hover:text-green-600"
//                       >
//                         <FaDownload />
//                       </a>
//                       <FaTrash
//                         className="text-red-400 hover:text-red-600 cursor-pointer"
//                         onClick={() => handleDelete(version._id)}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default Files;
