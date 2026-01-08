import { useState, useMemo } from 'react';
import {
  useGetConferencesQuery,
  useGetDashboardStatsQuery,
  useGetAuditLogsQuery,
  useGetTracksQuery,
} from '../../redux/api/conferencesApi';
import CircularProgress from '@mui/material/CircularProgress';

const ReportsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  
  const { data: conferencesData, isLoading: conferencesLoading } = useGetConferencesQuery();
  const { data: tracksData } = useGetTracksQuery(selectedConferenceId!, {
    skip: !selectedConferenceId,
  });
  const { data: dashboardData, isLoading: dashboardLoading } = useGetDashboardStatsQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );
  const { data: auditLogsData, isLoading: auditLogsLoading, error: auditLogsError } = useGetAuditLogsQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );

  const conferences = useMemo(() => {
    return conferencesData?.data && Array.isArray(conferencesData.data)
      ? conferencesData.data
      : [];
  }, [conferencesData]);

  // Auto-select first conference if available
  useMemo(() => {
    if (!selectedConferenceId && conferences.length > 0) {
      setSelectedConferenceId(conferences[0].id);
    }
  }, [conferences, selectedConferenceId]);

  const tracks = useMemo(() => {
    return tracksData?.data && Array.isArray(tracksData.data)
      ? tracksData.data
      : [];
  }, [tracksData]);

  // Get stats from API
  const stats = dashboardData?.data || {
    totalSubmissions: 0,
    totalSubmissionsChange: undefined,
    acceptanceRate: 0,
    acceptanceRateChange: undefined,
    totalAccepted: 0,
    totalRejected: 0,
    totalReviewers: 0,
    averageSLA: undefined,
    averageSLAChange: undefined,
  };

  // Get track stats from API
  const trackStats = useMemo(() => {
    if (!dashboardData?.data?.submissionsByTrack) return [];
    return dashboardData.data.submissionsByTrack.map((track) => ({
      name: track.trackName,
      submissions: track.submissions,
      accepted: track.accepted,
      rejected: track.rejected,
    }));
  }, [dashboardData]);

  const statusDistribution = dashboardData?.data?.statusDistribution || {
    accepted: 0,
    rejected: 0,
    reviewing: 0,
  };

  // Format activity logs from audit logs
  const activityLogs = useMemo(() => {
    if (!auditLogsData?.data) return [];
    
    return auditLogsData.data.slice(0, 10).map((log, index) => {
      const createdAt = new Date(log.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let timestamp = '';
      if (diffHours < 1) {
        timestamp = 'Vừa xong';
      } else if (diffHours < 24) {
        timestamp = `${diffHours} giờ trước`;
      } else if (diffDays < 7) {
        timestamp = `${diffDays} ngày trước`;
      } else {
        timestamp = createdAt.toLocaleDateString('vi-VN');
      }

      return {
        id: log.id,
        description: log.description || `${log.action} ${log.resourceType}`,
        detail: log.resourceType === 'SUBMISSION' ? `Bài báo - Track: ${log.resourceType}` : undefined,
        timestamp,
        hasIcon: index > 0, // First entry doesn't have icon
      };
    });
  }, [auditLogsData]);

  const handleExportReport = () => {
    // Handle export report
    console.log('Export report');
  };

  const maxSubmissions = trackStats.length > 0
    ? Math.max(...trackStats.map((t) => t.submissions), 1)
    : 1;

  if (conferencesLoading || dashboardLoading || auditLogsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress disableShrink />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Báo cáo và Phân tích
          </h1>
          <p className="text-gray-600">
            Tổng quan thống kê bài nộp, tỷ lệ chấp nhận và hoạt động của hệ thống
          </p>
        </div>

        {/* Filter and Export Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Lọc theo:</label>
              <select
                value={selectedConferenceId || ''}
                onChange={(e) => {
                  const confId = e.target.value ? Number(e.target.value) : null;
                  setSelectedConferenceId(confId);
                  setSelectedTrackId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Chọn hội nghị</option>
                {conferences.map((conf) => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTrackId || ''}
                onChange={(e) => setSelectedTrackId(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedConferenceId}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả chủ đề</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportReport}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Submissions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Tổng bài nộp</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
            <div className="flex items-center gap-2">
              {stats.totalSubmissionsChange && (
                <span className={`text-sm font-medium ${stats.totalSubmissionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalSubmissionsChange >= 0 ? '+' : ''}{stats.totalSubmissionsChange}%
                </span>
              )}
              <span className="text-xs text-gray-500">Tất cả phân ban</span>
            </div>
          </div>

          {/* Acceptance Rate Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Tỷ lệ chấp nhận</p>
              <p className="text-3xl font-bold text-gray-900">{stats.acceptanceRate.toFixed(1)}%</p>
            </div>
            <div className="flex items-center gap-2">
              {stats.acceptanceRateChange && (
                <span className={`text-sm font-medium ${stats.acceptanceRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.acceptanceRateChange >= 0 ? '+' : ''}{stats.acceptanceRateChange}%
                </span>
              )}
              <span className="text-xs text-gray-500">{stats.totalAccepted}/{stats.totalSubmissions} bài</span>
            </div>
          </div>

          {/* Reviewers Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Phản biện viên</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReviewers}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Đang hoạt động</span>
            </div>
          </div>

          {/* Average SLA Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">SLA trung bình</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageSLA ? `${stats.averageSLA} ngày` : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.averageSLAChange && (
                <span className={`text-sm font-medium ${stats.averageSLAChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.averageSLAChange >= 0 ? '+' : ''}{stats.averageSLAChange}%
                </span>
              )}
              <span className="text-xs text-gray-500">Thời gian phản biện</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thống kê bài nộp theo phân ban
              </h3>
              <div className="space-y-4">
                {trackStats.map((track, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{track.name}</span>
                      <span className="text-xs text-gray-500">{track.submissions} bài</span>
                    </div>
                    <div className="flex gap-2 h-8">
                      {/* Submissions bar */}
                      <div
                        className="bg-blue-500 rounded-l"
                        style={{
                          width: `${(track.submissions / maxSubmissions) * 100}%`,
                        }}
                        title={`Bài nộp: ${track.submissions}`}
                      />
                      {/* Accepted bar */}
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(track.accepted / maxSubmissions) * 100}%`,
                        }}
                        title={`Chấp nhận: ${track.accepted}`}
                      />
                      {/* Rejected bar */}
                      <div
                        className="bg-red-500 rounded-r"
                        style={{
                          width: `${(track.rejected / maxSubmissions) * 100}%`,
                        }}
                        title={`Từ chối: ${track.rejected}`}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-500 rounded"></span>
                        Bài nộp: {track.submissions}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded"></span>
                        Chấp nhận: {track.accepted}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded"></span>
                        Từ chối: {track.rejected}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tỷ lệ chấp nhận bài
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Pie Chart using CSS */}
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Accepted segment (57%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${(statusDistribution.accepted / 100) * 251.2} 251.2`}
                      strokeDashoffset="0"
                    />
                    {/* Rejected segment (29%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${(statusDistribution.rejected / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${(statusDistribution.accepted / 100) * 251.2}`}
                    />
                    {/* Reviewing segment (15%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray={`${(statusDistribution.reviewing / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${((statusDistribution.accepted + statusDistribution.rejected) / 100) * 251.2}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.acceptanceRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Chấp nhận</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span className="text-sm text-gray-700">Chấp nhận: {statusDistribution.accepted}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded"></span>
                    <span className="text-sm text-gray-700">Từ chối: {statusDistribution.rejected}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-500 rounded"></span>
                    <span className="text-sm text-gray-700">Đang xét: {statusDistribution.reviewing}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Nhật ký hoạt động</h3>
          </div>
          <div className="space-y-0">
            {auditLogsLoading ? (
              <div className="py-8 flex justify-center">
                <CircularProgress size={24} disableShrink />
              </div>
            ) : auditLogsError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Không thể tải nhật ký hoạt động</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thử lại sau</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Chưa có hoạt động nào</p>
              </div>
            ) : (
              activityLogs.map((log, index) => (
                <div
                  key={log.id}
                  className={`py-4 ${index !== activityLogs.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {log.hasIcon && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                    {!log.hasIcon && <div className="w-3 flex-shrink-0"></div>}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.description}</p>
                      {log.detail && (
                        <p className="text-xs text-gray-500 mt-1">{log.detail}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {log.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
