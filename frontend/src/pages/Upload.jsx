import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { FaCloudUploadAlt, FaFileAlt, FaTimes, FaCheck, FaSpinner } from "react-icons/fa";

const Upload = () => {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessage("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Successfully uploaded: ${data.file.name}`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage(`❌ Upload failed: ${data.error || data.message}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed: Server error");
    }

    setUploading(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '📦',
      rar: '📦'
    };
    return iconMap[extension] || '📄';
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Upload Files</h1>
          <p className="text-gray-400 mt-1">Upload and manage your files. Zeno AI can search through your PDF documents.</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="flex-1 bg-foreground rounded-xl border border-gray-800 p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Drag & Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              dragActive 
                ? "border-primary bg-primary/10" 
                : "border-gray-600 hover:border-gray-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="*/*"
            />
            
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto">
                <FaCloudUploadAlt className="text-white text-3xl" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {dragActive ? "Drop your file here" : "Upload your files"}
                </h3>
                <p className="text-gray-400 mb-4">
                  Drag and drop your files here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports all file types • Max size: 100MB
                </p>
              </div>
            </div>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getFileIcon(selectedFile.name)}</div>
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg transition-all duration-200 ${
                  uploading 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:shadow-lg hover:scale-105"
                }`}
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Upload File</span>
                  </>
                )}
              </button>
              
              <button
                onClick={removeFile}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${
              message.includes('✅') 
                ? 'bg-green-900/20 border-green-700 text-green-400' 
                : 'bg-red-900/20 border-red-700 text-red-400'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
