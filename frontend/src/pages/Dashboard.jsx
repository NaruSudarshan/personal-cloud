import { FaCloudUploadAlt, FaFolderOpen, FaUsers, FaChartLine, FaClock, FaFileAlt, FaSearch } from "react-icons/fa";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Storage",
      value: "2.3 GB",
      change: "+12%",
      icon: FaCloudUploadAlt,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Active Users",
      value: "1",
      change: "+0%",
      icon: FaUsers,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Total Files",
      value: "36",
      change: "+8%",
      icon: FaFolderOpen,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Storage Used",
      value: "68%",
      change: "+5%",
      icon: FaChartLine,
      color: "from-orange-500 to-orange-600"
    }
  ];

  const recentFiles = [
    { name: "Project_Report.pdf", type: "PDF", size: "2.4 MB", date: "2 hours ago" },
    { name: "Presentation.pptx", type: "PPTX", size: "15.2 MB", date: "1 day ago" },
    { name: "Data_Analysis.xlsx", type: "XLSX", size: "8.7 MB", date: "2 days ago" },
    { name: "Meeting_Notes.docx", type: "DOCX", size: "1.2 MB", date: "3 days ago" }
  ];

  const recentActivity = [
    { action: "Uploaded", file: "Project_Report.pdf", user: "John Doe", time: "2 hours ago" },
    { action: "Downloaded", file: "Presentation.pptx", user: "John Doe", time: "1 day ago" },
    { action: "Shared", file: "Data_Analysis.xlsx", user: "John Doe", time: "2 days ago" },
    { action: "Deleted", file: "Old_File.pdf", user: "John Doe", time: "3 days ago" }
  ];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your files. Use Zeno AI to search through your PDF documents.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-400">Last updated</p>
            <p className="text-white font-medium">Just now</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-foreground rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs text-green-400 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Recent Files */}
        <div className="bg-foreground rounded-xl border border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Files</h2>
              <button className="text-primary hover:text-secondary text-sm font-medium transition-colors">
                View All
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {recentFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <FaFileAlt className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">{file.type} • {file.size}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{file.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-foreground rounded-xl border border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <button className="text-primary hover:text-secondary text-sm font-medium transition-colors">
                View All
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <FaClock className="text-gray-400 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()}{" "}
                      <span className="text-primary">{activity.file}</span>
                    </p>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions
      <div className="mt-6 bg-foreground rounded-xl border border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FaCloudUploadAlt className="text-primary text-xl" />
            <span className="text-white font-medium">Upload Files</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FaFolderOpen className="text-primary text-xl" />
            <span className="text-white font-medium">View Files</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FaUsers className="text-primary text-xl" />
            <span className="text-white font-medium">Manage Users</span>
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
