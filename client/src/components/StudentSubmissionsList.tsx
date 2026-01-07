import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetMySubmissionsQuery,
  useWithdrawSubmissionMutation,
} from '../redux/api/submissionsApi';
import { useGetConferencesQuery, useGetPublicTracksQuery } from '../redux/api/conferencesApi';
import { useGetAnonymizedReviewsForSubmissionQuery } from '../redux/api/reviewsApi';
import { formatApiError } from '../utils/api-helpers';
import { showToast } from '../utils/toast';
import type { Submission, SubmissionStatus, Track } from '../types/api.types';

const StudentSubmissionsList = () => {
  const navigate = useNavigate();
  const { data: submissionsData, isLoading } = useGetMySubmissionsQuery();
  const { data: conferencesData } = useGetConferencesQuery();
  const [withdrawSubmission, { isLoading: isWithdrawing }] = useWithdrawSubmissionMutation();

  const submissions: Submission[] = submissionsData?.data || [];
  const conferences = conferencesData?.data || [];

  // Get unique conference IDs
  const conferenceIds = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.conferenceId).filter(Boolean))) as number[],
    [submissions]
  );

  // Fetch tracks for the first conference (to avoid too many API calls)
  // For other conferences, we'll show trackId
  const firstConferenceId = conferenceIds[0];
  const { data: firstConferenceTracksData } = useGetPublicTracksQuery(firstConferenceId || 0, {
    skip: !firstConferenceId,
  });

  // Build tracks map for the first conference
  const tracksMap = useMemo(() => {
    const map = new Map<number, string>();
    if (firstConferenceId && firstConferenceTracksData?.data) {
      firstConferenceTracksData.data.forEach((track: Track) => {
        map.set(track.id, track.name);
      });
    }
    return map;
  }, [firstConferenceId, firstConferenceTracksData]);

  // Group submissions by status
  const submittedSubmissions = submissions.filter(
    (s) => s.status !== 'DRAFT' && s.status !== 'WITHDRAWN'
  );
  const draftSubmissions = submissions.filter((s) => s.status === 'DRAFT');

  const getConferenceName = (conferenceId: number): string => {
    const conference = conferences.find((c) => c.id === conferenceId);
    return conference?.name || `Conference #${conferenceId}`;
  };

  const getTrackName = (conferenceId: number, trackId: number): string => {
    // Only show track name for the first conference (to avoid too many API calls)
    if (conferenceId === firstConferenceId) {
      return tracksMap.get(trackId) || `Track #${trackId}`;
    }
    return `Track #${trackId}`;
  };

  const getStatusLabel = (status: SubmissionStatus): string => {
    const statusMap: Record<SubmissionStatus, string> = {
      DRAFT: 'Bản nháp',
      SUBMITTED: 'Đã nộp',
      REVIEWING: 'Đang phản biện',
      ACCEPTED: 'Đã chấp nhận',
      REJECTED: 'Đã từ chối',
      WITHDRAWN: 'Đã rút',
      CAMERA_READY: 'Đã nộp bản cuối',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: SubmissionStatus): string => {
    const colorMap: Record<SubmissionStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      REVIEWING: 'bg-yellow-100 text-yellow-700',
      ACCEPTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      WITHDRAWN: 'bg-gray-100 text-gray-700',
      CAMERA_READY: 'bg-teal-100 text-teal-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const handleEdit = (submission: Submission) => {
    navigate(
      `/student/submit?conferenceId=${submission.conferenceId}&trackId=${submission.trackId}&submissionId=${submission.id}`
    );
  };

  const handleDelete = async (submission: Submission) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa/rút bài này không?')) {
      return;
    }

    try {
      await withdrawSubmission(submission.id).unwrap();
      showToast.success('Đã xóa/rút bài thành công');
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return null; // Don't show anything if no submissions
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Submitted Submissions */}
      {submittedSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Bài đã nộp</h2>
          <div className="space-y-4">
            {submittedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                conferenceName={getConferenceName(submission.conferenceId)}
                trackName={getTrackName(submission.conferenceId, submission.trackId)}
                statusLabel={getStatusLabel(submission.status)}
                statusColor={getStatusColor(submission.status)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isWithdrawing={isWithdrawing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Submissions */}
      {draftSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Bản nháp</h2>
          <div className="space-y-4">
            {draftSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                conferenceName={getConferenceName(submission.conferenceId)}
                trackName={getTrackName(submission.conferenceId, submission.trackId)}
                statusLabel={getStatusLabel(submission.status)}
                statusColor={getStatusColor(submission.status)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isWithdrawing={isWithdrawing}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SubmissionCardProps {
  submission: Submission;
  conferenceName: string;
  trackName: string;
  statusLabel: string;
  statusColor: string;
  onEdit: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  isWithdrawing: boolean;
}

const SubmissionCard = ({
  submission,
  conferenceName,
  trackName,
  statusLabel,
  statusColor,
  onEdit,
  onDelete,
  isWithdrawing,
}: SubmissionCardProps) => {
  const [showReviews, setShowReviews] = useState(false);
  
  // Check if submission has reviews (only query for non-draft submissions)
  // Prefetch reviews to check if they exist (for disabling edit/delete)
  const shouldCheckReviews = submission.status !== 'DRAFT' && 
                              (submission.status === 'SUBMITTED' || 
                               submission.status === 'REVIEWING' || 
                               submission.status === 'ACCEPTED' || 
                               submission.status === 'REJECTED' || 
                               submission.status === 'CAMERA_READY');
  
  // Prefetch reviews to check if they exist (always fetch if shouldCheckReviews, not just when expanded)
  const { data: reviewsData, isLoading: isLoadingReviews } = useGetAnonymizedReviewsForSubmissionQuery(submission.id, {
    skip: !shouldCheckReviews,
  });
  const hasReviews = (reviewsData?.data?.length || 0) > 0;
  
  // Cannot edit/delete if submission has reviews
  // Also cannot edit/delete if status is ACCEPTED, REJECTED, or CAMERA_READY (final states)
  const canEdit = !hasReviews && 
                  submission.status !== 'ACCEPTED' && 
                  submission.status !== 'REJECTED' && 
                  submission.status !== 'CAMERA_READY' &&
                  (submission.status === 'DRAFT' || submission.status === 'SUBMITTED');
  
  const canDelete = !hasReviews && 
                    submission.status !== 'ACCEPTED' && 
                    submission.status !== 'REJECTED' && 
                    submission.status !== 'CAMERA_READY' &&
                    (submission.status === 'DRAFT' || submission.status === 'SUBMITTED' || submission.status === 'REVIEWING');
  
  // Show reviews button if submission has reviews or is in review states
  const canViewReviews = hasReviews || 
                         submission.status === 'REVIEWING' || 
                         submission.status === 'ACCEPTED' || 
                         submission.status === 'REJECTED' || 
                         submission.status === 'CAMERA_READY';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{submission.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">Hội nghị:</span> {conferenceName}
            </div>
            <div>
              <span className="font-medium">Chủ đề:</span> {trackName}
            </div>
            <div>
              <span className="font-medium">Tóm tắt:</span>{' '}
              {submission.abstract.length > 100
                ? `${submission.abstract.substring(0, 100)}...`
                : submission.abstract}
            </div>
            <div>
              <span className="font-medium">Ngày nộp:</span>{' '}
              {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {submission.fileUrl && (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:text-teal-700 underline"
            >
              Xem file
            </a>
          )}
        </div>
      </div>
      {(canEdit || canDelete || canViewReviews) && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {canViewReviews && (
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="px-4 py-2 text-sm text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
            >
              {showReviews ? 'Ẩn phản biện' : 'Xem phản biện'}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(submission)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sửa
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(submission)}
              disabled={isWithdrawing}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {submission.status === 'DRAFT' ? 'Xóa' : 'Rút bài'}
            </button>
          )}
        </div>
      )}
      
      {/* Reviews Table - Expandable */}
      {showReviews && canViewReviews && (
        <ReviewsTable
          submissionId={submission.id}
          isLoading={isLoadingReviews}
        />
      )}
    </div>
  );
};

// Table component to display anonymized reviews inline
interface ReviewsTableProps {
  submissionId: string;
  isLoading: boolean;
}

const ReviewsTable = ({ submissionId, isLoading }: ReviewsTableProps) => {
  const { data: reviewsData, error } = useGetAnonymizedReviewsForSubmissionQuery(submissionId);
  const reviews = reviewsData?.data || [];

  const getRecommendationLabel = (recommendation: string): string => {
    const map: Record<string, string> = {
      ACCEPT: 'Chấp nhận',
      WEAK_ACCEPT: 'Chấp nhận với sửa nhỏ',
      WEAK_REJECT: 'Từ chối yếu',
      REJECT: 'Từ chối',
    };
    return map[recommendation] || recommendation;
  };

  const getRecommendationColor = (recommendation: string): string => {
    const map: Record<string, string> = {
      ACCEPT: 'bg-green-100 text-green-700',
      WEAK_ACCEPT: 'bg-teal-100 text-teal-700',
      WEAK_REJECT: 'bg-yellow-100 text-yellow-700',
      REJECT: 'bg-red-100 text-red-700',
    };
    return map[recommendation] || 'bg-gray-100 text-gray-700';
  };

  // Calculate average score
  const averageScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Không thể tải phản biện. Vui lòng thử lại sau.
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có phản biện nào cho bài nộp này.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-600">Số phản biện</p>
                <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Điểm trung bình</p>
                <p className="text-2xl font-bold text-teal-600">{averageScore}/10</p>
              </div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                    Điểm số
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                    Đề xuất
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                    Nhận xét
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">Reviewer #{index + 1}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-teal-600">{review.score.toFixed(1)}/10</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getRecommendationColor(review.recommendation)}`}>
                        {getRecommendationLabel(review.recommendation)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.commentForAuthor || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentSubmissionsList;

