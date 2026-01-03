import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetMySubmissionsQuery,
  useWithdrawSubmissionMutation,
} from '../redux/api/submissionsApi';
import { useGetConferencesQuery, useGetPublicTracksQuery } from '../redux/api/conferencesApi';
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
  const canEdit = submission.status === 'DRAFT' || submission.status === 'SUBMITTED';
  const canDelete = submission.status === 'DRAFT' || submission.status === 'SUBMITTED' || submission.status === 'REVIEWING';

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
              {new Date(submission.createdAt).toLocaleDateString('vi-VN', {
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
      {(canEdit || canDelete) && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
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
    </div>
  );
};

export default StudentSubmissionsList;

