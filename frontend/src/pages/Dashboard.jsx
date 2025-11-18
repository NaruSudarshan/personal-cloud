import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaFileAlt, FaUsers, FaRobot, FaDatabase, FaChartPie } from 'react-icons/fa';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const defaultDashboardData = {
    stats: {
      totalFiles: 0,
      totalStorage: '0 MB',
      activeUsers: 0,
      aiProcessing: {
        pending: 0,
        processing: 0,
        ready: 0,
        error: 0
      }
    },
    storageUsage: 0,
    recentFiles: [],
    fileTypes: {}
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const normalizeDashboardData = (data) => {
    const safeData = data && typeof data === 'object' ? data : {};
    return {
      ...defaultDashboardData,
      ...safeData,
    stats: {
      ...defaultDashboardData.stats,
        ...safeData.stats,
      aiProcessing: {
        ...defaultDashboardData.stats.aiProcessing,
          ...(safeData.stats?.aiProcessing || {})
      }
    },
      storageUsage: typeof safeData.storageUsage === 'number'
        ? Math.max(0, Math.min(100, safeData.storageUsage))
        : defaultDashboardData.storageUsage
    };
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setDashboardData(normalizeDashboardData(response.data));
      setError('');
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart options (reusable)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 15,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const stats = dashboardData?.stats || defaultDashboardData.stats;
  const aiProcessing = stats.aiProcessing || defaultDashboardData.stats.aiProcessing;
  const storageUsage = typeof dashboardData?.storageUsage === 'number'
    ? dashboardData.storageUsage
    : defaultDashboardData.storageUsage;

  // Prepare chart data
  const aiStatusData = {
    labels: Object.keys(aiProcessing),
    datasets: [{
      data: Object.values(aiProcessing),
      backgroundColor: [
        'rgba(255, 206, 86, 0.8)',   // pending
        'rgba(54, 162, 235, 0.8)',   // processing
        'rgba(75, 192, 192, 0.8)',   // ready
        'rgba(255, 99, 132, 0.8)'    // error
      ],
      borderColor: [
        'rgba(255, 206, 86, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  const storageData = {
    labels: ['Used', 'Available'],
    datasets: [{
      data: [storageUsage, 100 - storageUsage],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(55, 65, 81, 0.5)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(55, 65, 81, 1)'
      ],
      borderWidth: 1
    }]
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-white text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-white p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your storage and processing status</p>
        </div>
        <div className="text-sm text-gray-400">
          Welcome back, {user?.name || user?.username}!
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 flex-shrink-0">
        {/* Total Files */}
        <div className="bg-foreground rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Total Files</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalFiles}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FaFileAlt className="text-white text-xl" />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-foreground rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Storage Used</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalStorage}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <FaDatabase className="text-white text-xl" />
            </div>
          </div>
        </div>

        {/* Users - Only show for root users */}
        {user?.role === 'root' && (
          <div className="bg-foreground rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <FaUsers className="text-white text-xl" />
              </div>
            </div>
          </div>
        )}

        {/* AI Ready */}
        <div className="bg-foreground rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">AI Ready Files</p>
              <p className="text-2xl font-bold text-white mt-1">{aiProcessing.ready}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <FaRobot className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* AI Processing */}
        <div className="bg-foreground rounded-xl border border-gray-800 p-6 flex flex-col overflow-hidden">
          <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <FaRobot className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Processing Status</h2>
              <p className="text-gray-400 text-sm">Current status of file processing</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            <div className="w-full max-w-xs">
              <Pie data={aiStatusData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-foreground rounded-xl border border-gray-800 p-6 flex flex-col overflow-hidden">
          <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <FaChartPie className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Storage Usage</h2>
              <p className="text-gray-400 text-sm">Current storage allocation</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            <div className="w-full max-w-xs">
              <Pie data={storageData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;