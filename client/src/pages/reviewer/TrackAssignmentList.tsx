import { useState } from 'react';
import { useGetMyAssignmentsQuery, useAcceptAssignmentMutation, useRejectAssignmentMutation } from '../../redux/api/reviewsApi';
import { useGetConferencesQuery, useGetTracksQuery } from '../../redux/api/conferencesApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import type { Track, Conference } from '../../types/api.types';

interface TrackAssignmentListProps {
  onAcceptTrack?: (trackId: number, conferenceId: number) => void;
}

const TrackAssignmentList = ({ onAcceptTrack }: TrackAssignmentListProps) => {
  const { data: assignmentsData } = useGetMyAssignmentsQuery();
  const { data: conferencesData } = useGetConferencesQuery();
  const assignments = assignmentsData?.data || [];
  const conferences: Conference[] = conferencesData?.data || [];

  const [acceptAssignment] = useAcceptAssignmentMutation();
  const [rejectAssignment] = useRejectAssignmentMutation();

  // Get unique conference IDs from assignments
  const conferenceIds = Array.from(
    new Set(
      assignments
        .filter((a: any) => a.submission?.conferenceId)
        .map((a: any) => a.submission.conferenceId)
    )
  ) as number[];

  // Fetch tracks for first conference (simplified - can be enhanced to fetch all)
  const firstConferenceId = conferenceIds[0];
  const { data: tracksData } = useGetTracksQuery(firstConferenceId || 0, {
    skip: !firstConferenceId,
  });
  const allTracks: Track[] = tracksData?.data || [];

  // Group assignments by track and conference
  const trackAssignments = new Map<string, { assignments: any[]; track: Track | null; conference: Conference | null }>();
  
  assignments.forEach((assignment: any) => {
    if (assignment.status === 'PENDING' && assignment.submission) {
      const key = `${assignment.submission.conferenceId}-${assignment.submission.trackId}`;
      if (!trackAssignments.has(key)) {
        const conference = conferences.find((c) => c.id === assignment.submission.conferenceId);
        const track = allTracks.find((t) => t.id === assignment.submission.trackId);
        trackAssignments.set(key, {
          assignments: [],
          track: track || null,
          conference: conference || null,
        });
      }
      trackAssignments.get(key)!.assignments.push(assignment);
    }
  });

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

  const handleReject = async (assignmentId: number) => {
    try {
      await rejectAssignment(assignmentId).unwrap();
      showToast.success('Đã từ chối phân công');
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  if (trackAssignments.size === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Chưa có phân công nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(trackAssignments.entries()).map(([key, { assignments, track, conference }]) => {
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
      })}
    </div>
  );
};

export default TrackAssignmentList;

