import { useMemo, useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetMyAssignmentsQuery, useAcceptAssignmentMutation, useRejectAssignmentMutation } from '../../redux/api/reviewsApi';
import { useGetConferencesQuery, useGetTracksQuery } from '../../redux/api/conferencesApi';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import type { Track, Conference, Submission } from '../../types/api.types';

interface TrackAssignmentListProps {
  onAcceptTrack?: (trackId: number, conferenceId: number) => void;
}

// Component to fetch submission data
const SubmissionFetcher = ({ submissionId, onLoaded }: { submissionId: string; onLoaded: (submission: Submission) => void }) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId, {
    skip: false,
  });
  
  useEffect(() => {
    if (submissionData?.data) {
      onLoaded(submissionData.data);
    }
  }, [submissionData, onLoaded]);
  
  return null;
};

const TrackAssignmentList = ({ onAcceptTrack }: TrackAssignmentListProps) => {
  const { data: assignmentsData } = useGetMyAssignmentsQuery();
  const { data: conferencesData } = useGetConferencesQuery();
  const assignments = assignmentsData?.data || [];
  const conferences: Conference[] = conferencesData?.data || [];

  const [acceptAssignment] = useAcceptAssignmentMutation();
  const [rejectAssignment] = useRejectAssignmentMutation();

  // Get unique conference IDs from assignments (from assignment or submission)
  const conferenceIds = Array.from(
    new Set(
      assignments
        .map((a: any) => a.conferenceId || a.submission?.conferenceId)
        .filter(Boolean)
    )
  ) as number[];

  // Fetch tracks for all conferences (fetch for first conference, can be enhanced later)
  const firstConferenceId = conferenceIds[0];
  const { data: tracksData } = useGetTracksQuery(firstConferenceId || 0, {
    skip: !firstConferenceId,
  });
  const allTracks: Track[] = tracksData?.data || [];

  // Get unique submission IDs from PENDING assignments
  const pendingAssignments = assignments.filter((a: any) => a.status === 'PENDING');
  const submissionIds = Array.from(
    new Set(
      pendingAssignments
        .map((a: any) => a.submissionId)
        .filter(Boolean)
        .map((id: any) => String(id)) // Convert to string
    )
  ) as string[];

  // Store fetched submissions
  const [submissionsMap, setSubmissionsMap] = useState<Map<string, Submission>>(new Map());

  const handleSubmissionLoaded = (submission: Submission) => {
    setSubmissionsMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(submission.id, submission);
      return newMap;
    });
  };

  // Group assignments by track and conference using fetched submissions
  const trackAssignments = useMemo(() => {
    const map = new Map<string, { assignments: any[]; track: Track | null; conference: Conference | null }>();
    
    pendingAssignments.forEach((assignment: any) => {
      // Get submission from map or from assignment
      const submissionIdStr = String(assignment.submissionId);
      const submission = submissionsMap.get(submissionIdStr) || assignment.submission;
      
      if (!submission) {
        // Submission not loaded yet, skip for now
        return;
      }

      const conferenceId = assignment.conferenceId || submission.conferenceId;
      const trackId = assignment.trackId || submission.trackId;
      
      if (!conferenceId || !trackId) {
        return;
      }

      const key = `${conferenceId}-${trackId}`;
      
      if (!map.has(key)) {
        const conference = conferences.find((c) => c.id === conferenceId);
        const track = allTracks.find((t) => t.id === trackId);
        map.set(key, {
          assignments: [],
          track: track || null,
          conference: conference || null,
        });
      }
      map.get(key)!.assignments.push(assignment);
    });
    
    return map;
  }, [pendingAssignments, conferences, allTracks, submissionsMap]);

  const handleAccept = async (assignments: any[], trackId: number, conferenceId: number) => {
    try {
      // Accept all assignments in this track
      await Promise.all(assignments.map((assignment) => acceptAssignment(assignment.id).unwrap()));
      showToast.success(`Đã chấp nhận ${assignments.length} phân công thành công`);
      if (onAcceptTrack) {
        onAcceptTrack(trackId, conferenceId);
      }
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };


  return (
    <div className="space-y-4">
      {/* Fetch submissions in background */}
      {submissionIds.map((submissionId) => (
        <SubmissionFetcher
          key={submissionId}
          submissionId={submissionId}
          onLoaded={handleSubmissionLoaded}
        />
      ))}
      
      {trackAssignments.size === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {submissionIds.length > 0 && submissionsMap.size === 0 ? (
            <div className="flex justify-center items-center py-4">
              <CircularProgress size={24} disableShrink />
            </div>
          ) : (
            <div>Chưa có phân công nào</div>
          )}
        </div>
      ) : (
        Array.from(trackAssignments.entries()).map(([key, { assignments, track, conference }]) => {
        if (!track) return null;

        return (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{track.name}</h3>
                {conference && (
                  <p className="text-sm text-gray-500">{conference.name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!track) return;
                    const [conferenceId, trackId] = key.split('-').map(Number);
                    handleAccept(assignments, trackId, conferenceId);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Chấp nhận
                </button>
                <button
                  onClick={async () => {
                    // Reject all assignments in this track
                    try {
                      await Promise.all(assignments.map((assignment) => rejectAssignment(assignment.id).unwrap()));
                      showToast.success(`Đã từ chối ${assignments.length} phân công`);
                    } catch (error) {
                      showToast.error(formatApiError(error));
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Từ chối
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Số bài nộp: {assignments.length}
            </p>
          </div>
        );
        })
      )}
    </div>
  );
};

export default TrackAssignmentList;

