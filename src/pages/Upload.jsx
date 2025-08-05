import { useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    // TODO: Replace with actual upload logic (e.g., POST to backend or S3 bucket)
    alert(`Uploading: ${selectedFile.name}`);
    setSelectedFile(null);
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-3xl font-bold mb-6 text-primary">Upload File</h2>

      <div className="bg-foreground p-6 rounded shadow max-w-xl mx-auto">
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-600 p-10 rounded hover:border-orange-600 transition"
        >
          <FaCloudUploadAlt className="text-4xl text-orange-500 mb-2" />
          <p className="text-lg">Click or drag & drop to upload</p>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <div className="mt-4">
            <p className="text-gray-300">Selected File: <span className="text-white font-semibold">{selectedFile.name}</span></p>
            <button
              onClick={handleUpload}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded transition"
            >
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
