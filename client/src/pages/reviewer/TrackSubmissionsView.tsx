import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../redux/api/submissionsApi';
import { useGetMyAssignmentsQuery } from '../../redux/api/reviewsApi';
import type { TrackMember, Submission, ReviewAssignment } from '../../types/api.types';
import { showToast } from '../../utils/toast';

interface TrackSubmissionsViewProps {
  trackAssignment: TrackMember;
  onEvaluate: (submissionId: string, assignmentId: number) => void;
}

const TrackSubmissionsView = ({ trackAssignment, onEvaluate }: TrackSubmissionsViewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const track = trackAssignment.track;
  
  // Fetch submissions with status SUBMITTED or REVIEWING (not ACCEPTED/REJECTED)
  // Reviewer needs to see submissions that are waiting for review, not already decided by Chair
  const { data: submissionsData, isLoading: submissionsLoading } = useGetSubmissionsQuery(
    isExpanded && track ? { 
      trackId: track.id, 
      limit: 100,
      // Note: API might not support multiple status filter, so we'll filter in frontend
    } : undefined,
    { skip: !isExpanded || !track }
  );

  const { data: assignmentsData } = useGetMyAssignmentsQuery();
  const assignments: ReviewAssignment[] = assignmentsData?.data || [];

  // Create mapping of submissionId to assignment
  const submissionToAssignmentMap = new Map<string, ReviewAssignment>();
  assignments.forEach((assignment) => {
    const submissionId = String(assignment.submissionId);
    submissionToAssignmentMap.set(submissionId, assignment);
  });

  const allSubmissions: Submission[] = submissionsData?.data || [];
  
  // Filter to only show submissions that need review (SUBMITTED or REVIEWING)
  // Exclude ACCEPTED, REJECTED, WITHDRAWN, CAMERA_READY, DRAFT
  const submissions = allSubmissions.filter((submission) => 
    submission.status === 'SUBMITTED' || submission.status === 'REVIEWING'
  );
  
  // Convert submissions to assignments format
  const submissionsWithAssignments = submissions.map((submission) => {
    const existingAssignment = submissionToAssignmentMap.get(submission.id);
    if (existingAssignment) {
      return existingAssignment;
    }
    // Create a mock assignment for submissions without review assignment
    return {
      id: parseInt(submission.id.replace(/-/g, '').substring(0, 10)) || 0, // Generate a temporary ID
      submissionId: submission.id,
      reviewerId: 0,
      status: 'PENDING' as const,
      submission: submission,
      trackId: submission.trackId,
      conferenceId: submission.conferenceId,
    };
  });

  if (!track) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{track.name}</h3>
          {track.conference && (
            <p className="text-sm text-gray-500 mt-1">{track.conference.name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Ngày chấp nhận: {new Date(trackAssignment.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {isExpanded ? 'Ẩn bài nộp' : 'Xem các bài nộp'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {submissionsLoading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={24} disableShrink />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Chưa có bài nộp nào cần đánh giá trong chủ đề này
              {allSubmissions.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  (Có {allSubmissions.length} bài nhưng đã được quyết định hoặc chưa nộp)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {submissionsWithAssignments.map((assignment) => {
                const submission = assignment.submission || submissions.find(s => s.id === assignment.submissionId);
                if (!submission) return null;

                const status = assignment.status === 'ACCEPTED' 
                  ? 'Đã phân công' 
                  : assignment.status === 'PENDING' 
                  ? 'Chờ chấp nhận' 
                  : assignment.status === 'COMPLETED'
                  ? 'Đã hoàn thành'
                  : 'Chưa phân công';
                
                const statusClass = assignment.status === 'ACCEPTED'
                  ? 'bg-green-600 text-white'
                  : assignment.status === 'PENDING'
                  ? 'bg-yellow-500 text-white'
                  : assignment.status === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700';

                return (
                  <div key={submission.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {submission.id.substring(0, 8)}...
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
                            {status}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-800 mb-1">
                          {submission.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Tác giả: {submission.authorName || 'N/A'}
                        </p>
                        {submission.keywords && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {submission.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {keyword.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {assignment.status === 'ACCEPTED' || assignment.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              // If assignment has a valid ID (from review-service), use it
                              // Otherwise, we need to create assignment first
                              if (assignment.id && assignment.id > 0 && assignment.status === 'ACCEPTED') {
                                onEvaluate(submission.id, assignment.id);
                              } else {
                                showToast.info('Vui lòng chờ Chair phân công bài này để đánh giá');
                              }
                            }}
                            disabled={assignment.status !== 'ACCEPTED' || !assignment.id || assignment.id === 0}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {assignment.status === 'ACCEPTED' ? 'Đánh giá' : 'Chờ phân công'}
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg">
                            {assignment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Chưa phân công'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackSubmissionsView;

