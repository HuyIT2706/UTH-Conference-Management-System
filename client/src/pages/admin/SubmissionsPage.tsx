import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../redux/api/submissionsApi';
import { useGetConferencesQuery, useGetTracksQuery } from '../../redux/api/conferencesApi';
import type { Submission, Conference, SubmissionStatus } from '../../types/api.types';
import { formatApiError } from '../../utils/api-helpers';
import { showToast } from '../../utils/toast';

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const getStatusColor = (status: SubmissionStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-800';
    case 'REVIEWING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-600';
    case 'CAMERA_READY':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: SubmissionStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'SUBMITTED':
      return 'Đã nộp';
    case 'REVIEWING':
      return 'Đang đánh giá';
    case 'ACCEPTED':
      return 'Đã chấp nhận';
    case 'REJECTED':
      return 'Đã từ chối';
    case 'WITHDRAWN':
      return 'Đã rút';
    case 'CAMERA_READY':
      return 'Camera-ready';
    default:
      return status;
  }
};

const SubmissionsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch conferences
  const { data: conferencesData, isLoading: conferencesLoading } = useGetConferencesQuery();

  // Fetch tracks for selected conference
  const { data: tracksData, isLoading: tracksLoading } = useGetTracksQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId }
  );

  // Fetch submissions with filters
  const { data: submissionsData, isLoading: submissionsLoading, error: submissionsError } = useGetSubmissionsQuery({
    conferenceId: selectedConferenceId || undefined,
    trackId: selectedTrackId || undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
    page,
    limit,
  });

  const conferences = useMemo(() => {
    return (conferencesData?.data && Array.isArray(conferencesData.data)) ? conferencesData.data : [];
  }, [conferencesData]);

  const tracks = useMemo(() => {
    return (tracksData?.data && Array.isArray(tracksData.data)) ? tracksData.data : [];
  }, [tracksData]);

  const submissions = useMemo(() => {
    return (submissionsData?.data && Array.isArray(submissionsData.data)) ? submissionsData.data : [];
  }, [submissionsData]);

  const pagination = submissionsData?.pagination;

  const handleViewDetail = (submissionId: string) => {
    // Open submission detail in new tab
    window.open(`/submissions/${submissionId}`, '_blank');
  };

  const handleDownloadFile = (fileUrl: string, title: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      showToast.error('Không có file để tải xuống');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Quản lý Bài nộp</h1>
        <p className="text-gray-600">Xem danh sách bài nộp của thí sinh theo hội nghị và chủ đề</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Conference Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hội nghị
            </label>
            <select
              value={selectedConferenceId || ''}
              onChange={(e) => {
                setSelectedConferenceId(e.target.value ? Number(e.target.value) : null);
                setSelectedTrackId(null); // Reset track when conference changes
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tất cả hội nghị</option>
              {conferences.map((conference) => (
                <option key={conference.id} value={conference.id}>
                  {conference.name}
                </option>
              ))}
            </select>
          </div>

          {/* Track Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề
            </label>
            <select
              value={selectedTrackId || ''}
              onChange={(e) => {
                setSelectedTrackId(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              disabled={!selectedConferenceId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tất cả chủ đề</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as SubmissionStatus | '');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="SUBMITTED">Đã nộp</option>
              <option value="REVIEWING">Đang đánh giá</option>
              <option value="ACCEPTED">Đã chấp nhận</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="WITHDRAWN">Đã rút</option>
              <option value="CAMERA_READY">Camera-ready</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tiêu đề, tóm tắt..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {(conferencesLoading || tracksLoading || submissionsLoading) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      )}

      {/* Error */}
      {submissionsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">
            {formatApiError(submissionsError)}
          </p>
        </div>
      )}

      {/* Submissions List */}
      {!conferencesLoading && !submissionsLoading && !submissionsError && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Danh sách bài nộp
                {pagination && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({pagination.total} bài)
                  </span>
                )}
              </h2>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Không có bài nộp nào được tìm thấy.</p>
              {(!selectedConferenceId && !selectedTrackId && !selectedStatus && !searchQuery) && (
                <p className="mt-2 text-sm">Vui lòng chọn hội nghị hoặc chủ đề để xem bài nộp.</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tác giả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chủ đề
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày nộp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={submission.title}>
                            {submission.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.authorName || `ID: ${submission.authorId}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {tracks.find(t => t.id === submission.trackId)?.name || `Track #${submission.trackId}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              submission.status as SubmissionStatus
                            )}`}
                          >
                            {getStatusLabel(submission.status as SubmissionStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.submittedAt || submission.createdAt
                            ? new Date(submission.submittedAt || submission.createdAt).toLocaleDateString('vi-VN')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetail(submission.id)}
                              className="text-teal-600 hover:text-teal-900"
                            >
                              Xem chi tiết
                            </button>
                            {submission.fileUrl && (
                              <button
                                onClick={() => handleDownloadFile(submission.fileUrl!, submission.title)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Tải file
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} của {pagination.total} bài
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Trang {page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
