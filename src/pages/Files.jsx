import { FaDownload, FaTrashAlt } from "react-icons/fa";

const files = [
  { id: 1, name: "Resume.pdf", size: "200 KB", uploadedAt: "2025-08-05" },
  { id: 2, name: "Project.zip", size: "1.2 MB", uploadedAt: "2025-08-03" },
  { id: 3, name: "Image.png", size: "560 KB", uploadedAt: "2025-08-01" },
];

const MyFiles = () => {
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
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="p-4">{file.name}</td>
                <td className="p-4">{file.size}</td>
                <td className="p-4">{file.uploadedAt}</td>
                <td className="p-4 text-right space-x-4">
                  <button className="text-green-400 hover:text-green-500">
                    <FaDownload />
                  </button>
                  <button className="text-red-400 hover:text-red-500">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
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
