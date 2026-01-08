import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../../redux/api/submissionsApi';
import {
  useGetConferencesQuery,
  useGetTracksQuery,
} from '../../../redux/api/conferencesApi';
import type { SubmissionStatus } from '../../../types/api.types';
import { formatApiError } from '../../../utils/api-helpers';
import { showToast } from '../../../utils/toast';

const getStatusColor = (status: SubmissionStatus): string => {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'REVIEWING':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getStatusLabel = (status: SubmissionStatus): string => {
  switch (status) {
    case 'SUBMITTED':
      return 'Đã nộp';
    case 'WITHDRAWN':
      return 'Đã rút';
    case 'REVIEWING':
      return 'Chờ duyệt';
    default:
      return status;
  }
};

const SubmissionsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | ''>(
    '',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Fetch conferences
  const { data: conferencesData, isLoading: conferencesLoading } =
    useGetConferencesQuery();

  // Fetch tracks for selected conference
  const { data: tracksData, isLoading: tracksLoading } = useGetTracksQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );

  // Fetch submissions with filters
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useGetSubmissionsQuery({
    conferenceId: selectedConferenceId || undefined,
    trackId: selectedTrackId || undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
    page,
    limit,
  });

  const conferences = useMemo(() => {
    return conferencesData?.data && Array.isArray(conferencesData.data)
      ? conferencesData.data
      : [];
  }, [conferencesData]);

  const tracks = useMemo(() => {
    return tracksData?.data && Array.isArray(tracksData.data)
      ? tracksData.data
      : [];
  }, [tracksData]);

  const submissions = useMemo(() => {
    return submissionsData?.data && Array.isArray(submissionsData.data)
      ? submissionsData.data
      : [];
  }, [submissionsData]);

  // Filter submissions to only show SUBMITTED and WITHDRAWN
  const filteredSubmissions = useMemo(() => {
    if (!selectedStatus) {
      return submissions.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'WITHDRAWN',
      );
    }
    if (selectedStatus === 'SUBMITTED' || selectedStatus === 'WITHDRAWN') {
      return submissions.filter((s) => s.status === selectedStatus);
    }
    return [];
  }, [submissions, selectedStatus]);

  // Helper function to get track name
  const getTrackName = (trackId: number): string => {
    const track = tracks.find((t) => t.id === trackId);
    if (track) return track.name;
    return `Track: ${trackId}`;
  };

  const pagination = submissionsData?.pagination;

  const handleDownloadFile = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      showToast.error('Không có file để tải xuống');
    }
  };

  const handleEdit = (submissionId: string) => {
    // Handle edit action
    console.log('Edit submission:', submissionId);
  };

  const handleDelete = (submissionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài nộp này?')) {
      // Handle delete action
      console.log('Delete submission:', submissionId);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Main Content Container */}
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách bài nộp
          </h1>
          <p className="text-gray-600">
            Quản lý và xem danh sách các bài nộp từ thí sinh
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                  setSelectedConferenceId(
                    e.target.value ? Number(e.target.value) : null,
                  );
                  setSelectedTrackId(null);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  setSelectedTrackId(
                    e.target.value ? Number(e.target.value) : null,
                  );
                  setPage(1);
                }}
                disabled={!selectedConferenceId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="SUBMITTED">Đã nộp</option>
                <option value="WITHDRAWN">Đã rút</option>
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
                placeholder="Tìm theo tiêu đề, tác giả..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {(conferencesLoading || tracksLoading || submissionsLoading) && (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="flex justify-center items-center">
              <CircularProgress disableShrink />
            </div>
          </div>
        )}

        {/* Error */}
        {submissionsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{formatApiError(submissionsError)}</p>
          </div>
        )}

        {/* Submissions Table Card */}
        {!conferencesLoading && !submissionsLoading && !submissionsError && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Danh sách bài nộp
                  {pagination && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({pagination.total} bài)
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">Không có bài nộp nào được tìm thấy.</p>
                {!selectedConferenceId &&
                  !selectedTrackId &&
                  !selectedStatus &&
                  !searchQuery && (
                    <p className="mt-2 text-sm">
                      Vui lòng chọn hội nghị hoặc chủ đề để xem bài nộp.
                    </p>
                  )}
              </div>
            ) : (
              <>
                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Tiêu đề
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Tác giả
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Chủ đề
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Ngày nộp
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredSubmissions.map((submission) => (
                        <tr
                          key={submission.id}
                          className="hover:bg-gray-50 transition-colors"
                          style={{ height: '64px' }}
                        >
                          <td className="px-6 py-4">
                            <div
                              className="text-sm font-medium text-gray-900 max-w-md truncate"
                              title={submission.title}
                            >
                              {submission.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">
                                {submission.authorName ||
                                  `ID: ${submission.authorId}`}
                              </div>
                              {submission.coAuthors &&
                                submission.coAuthors.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span className="font-medium">
                                      Đồng tác giả:
                                    </span>{' '}
                                    {submission.coAuthors
                                      .map((ca) => ca.name)
                                      .join(', ')}
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {getTrackName(submission.trackId)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                submission.status as SubmissionStatus,
                              )}`}
                            >
                              {getStatusLabel(
                                submission.status as SubmissionStatus,
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {submission.submittedAt || submission.createdAt
                                ? new Date(
                                    submission.submittedAt ||
                                      submission.createdAt,
                                  ).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEdit(submission.id)}
                                className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                                style={{ color: '#059669' }}
                                title="Chỉnh sửa"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              {/* Kebab Menu */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setMenuOpen(
                                      menuOpen === submission.id
                                        ? null
                                        : submission.id,
                                    )
                                  }
                                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                  title="Thêm tùy chọn"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {menuOpen === submission.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setMenuOpen(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                      <div className="py-1">
                                        {submission.fileUrl && (
                                          <button
                                            onClick={() => {
                                              handleDownloadFile(
                                                submission.fileUrl!,
                                              );
                                              setMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            Tải file
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            handleDelete(submission.id);
                                            setMenuOpen(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                          Xóa
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Hiển thị {(page - 1) * limit + 1} -{' '}
                      {Math.min(page * limit, pagination.total)} của{' '}
                      {pagination.total} bài
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Trang {page} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) =>
                            Math.min(pagination.totalPages, p + 1),
                          )
                        }
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
};

export default SubmissionsPage;
