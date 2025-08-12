import { useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Uploaded: ${data.originalname}`);
      } else {
        setMessage(`❌ Upload failed: ${data.message}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed: Server error");
    }

    setUploading(false);
    setSelectedFile(null);
  };

  return (
    <div className="p-6 text-white min-h-[85vh]">
      <h2 className="text-3xl font-bold mb-6 text-orange-500">Upload File</h2>

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
            <p className="text-gray-300">
              Selected File:{" "}
              <span className="text-white font-semibold">{selectedFile.name}</span>
            </p>
            <button
              onClick={handleUpload}
              className={`mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded transition ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-orange-400 font-medium text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Upload;
