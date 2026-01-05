import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetMyTrackAssignmentsQuery } from '../../redux/api/conferencesApi';
import { showToast } from '../../utils/toast';
import TrackAssignmentList from './TrackAssignmentList';
import TrackSubmissionsView from './TrackSubmissionsView';
import ReviewForm from './ReviewForm';
import RebuttalWindow from './RebuttalWindow';

type TabType = 'assignment' | 'evaluate' | 'rebuttal';

const ReviewerDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('assignment');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // Check if user tries to access evaluate/rebuttal tab without selecting a submission
  useEffect(() => {
    if (activeTab === 'evaluate' && (!selectedSubmissionId || !selectedAssignmentId)) {
      showToast.error('Vui lòng chọn bài viết để đánh giá');
      setActiveTab('assignment');
    }
    if (activeTab === 'rebuttal' && !selectedSubmissionId) {
      showToast.error('Vui lòng chọn bài viết để xem phúc đáp');
      setActiveTab('assignment');
    }
  }, [activeTab, selectedSubmissionId, selectedAssignmentId]);

  const { data: trackAssignmentsData, isLoading: trackAssignmentsLoading, error: trackAssignmentsError } = useGetMyTrackAssignmentsQuery();
  
  const acceptedTrackAssignments = trackAssignmentsData?.data?.filter(
    (ta) => ta.status === 'ACCEPTED' && ta.track
  ) || [];

  if (trackAssignmentsLoading) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      </div>
    );
  }

  if (trackAssignmentsError) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="text-red-600">Lỗi tải dữ liệu phân công</div>
          </div>
        </div>
      </div>
    );
  }

  const handleEvaluateSubmission = (submissionId: string, assignmentId: number) => {
    setSelectedSubmissionId(submissionId);
    setSelectedAssignmentId(assignmentId);
    setActiveTab('evaluate');
  };

  const handleReviewComplete = () => {
    setActiveTab('rebuttal');
  };

  const handleBackToSubmissions = () => {
    setSelectedSubmissionId(null);
    setSelectedAssignmentId(null);
    setActiveTab('assignment');
  };

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Phân Công Phản Biện</h1>
          <p className="text-gray-600">Phân công phản biện viên cho các bài nộp</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => {
              setActiveTab('assignment');
              setSelectedSubmissionId(null);
              setSelectedAssignmentId(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'assignment'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Phân công phản biện
          </button>
          <button
            onClick={() => {
              if (selectedSubmissionId && selectedAssignmentId) {
                setActiveTab('evaluate');
              } else {
                showToast.error('Vui lòng chọn bài viết để đánh giá');
              }
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'evaluate'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            } ${!selectedSubmissionId || !selectedAssignmentId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Đánh giá bài viết
          </button>
          <button
            onClick={() => {
              if (selectedSubmissionId) {
                setActiveTab('rebuttal');
              } else {
                showToast.error('Vui lòng chọn bài viết để xem phúc đáp');
              }
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rebuttal'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            } ${!selectedSubmissionId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cửa sổ phúc đáp
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'assignment' && (
            <>
              <TrackAssignmentList
                onAcceptTrack={(trackId, conferenceId) => {
                  // Handle track acceptance - will refresh track assignments
                }}
              />
              
              {acceptedTrackAssignments.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Các chủ đề đã chấp nhận
                  </h2>
                  <div className="space-y-4">
                    {acceptedTrackAssignments.map((trackAssignment) => (
                      <TrackSubmissionsView
                        key={trackAssignment.id}
                        trackAssignment={trackAssignment}
                        onEvaluate={handleEvaluateSubmission}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'evaluate' && selectedSubmissionId && selectedAssignmentId && (
            <ReviewForm
              submissionId={selectedSubmissionId}
              assignmentId={selectedAssignmentId}
              onComplete={handleReviewComplete}
              onBack={handleBackToSubmissions}
            />
          )}

          {activeTab === 'evaluate' && (!selectedSubmissionId || !selectedAssignmentId) && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Vui lòng chọn bài viết để đánh giá
            </div>
          )}

          {activeTab === 'rebuttal' && selectedSubmissionId && (
            <RebuttalWindow submissionId={selectedSubmissionId} />
          )}

          {activeTab === 'rebuttal' && !selectedSubmissionId && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Vui lòng chọn bài viết để xem phúc đáp
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;

