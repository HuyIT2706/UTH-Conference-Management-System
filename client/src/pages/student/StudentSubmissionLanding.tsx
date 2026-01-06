import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetConferencesQuery,
  useGetPublicTracksQuery,
} from '../../redux/api/conferencesApi';
import type { Conference, Track } from '../../types/api.types';

const StudentSubmissionLanding = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetConferencesQuery();
  const conferences: Conference[] = data?.data || [];
  const [expandedConference, setExpandedConference] = useState<number | null>(
    null,
  );

  if (isLoading) return (
    <div className="p-6 flex justify-center items-center">
      <CircularProgress disableShrink />
    </div>
  );
  if (error) return <div className="p-6 text-red-600">Lỗi tải dữ liệu</div>;

  const isSubmissionOpen = (c: Conference) => {
    if (!c.submissionDeadline) return false;
    return new Date() <= new Date(c.submissionDeadline);
  };

  const handleSubmit = (conferenceId: number, trackId?: number) => {
    if (trackId) {
      navigate(
        `/student/submit?conferenceId=${conferenceId}&trackId=${trackId}`,
      );
    } else {
      navigate(`/student/submit?conferenceId=${conferenceId}`);
    }
  };

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Danh Sách Cuộc Thi Nghiên Cứu</h1>
        <p className="text-gray-600 mb-6 text-center text-lg">
          Chọn cuộc thi và chủ đề để nộp bài.
        </p>

        <div className="border-2 border-solid border-teal-200 rounded-lg p-5 space-y-5 ">
          {conferences.map((c) => (
            <ConferenceCard
              key={c.id}
              conference={c}
              isExpanded={expandedConference === c.id}
              onToggle={() =>
                setExpandedConference(expandedConference === c.id ? null : c.id)
              }
              onSubmit={handleSubmit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ConferenceCardProps {
  conference: Conference;
  isExpanded: boolean;
  onToggle: () => void;
  onSubmit: (conferenceId: number, trackId?: number) => void;
}

const ConferenceCard = ({
  conference,
  isExpanded,
  onToggle,
  onSubmit,
}: ConferenceCardProps) => {
  const { data: tracksData, isLoading: tracksLoading } =
    useGetPublicTracksQuery(conference.id, {
      skip: !isExpanded,
    });
  const tracks: Track[] = tracksData?.data || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-gray-800">
            {conference.name}
          </h2>
          {conference.submissionDeadline && (
            <p className="text-sm text-gray-500 mt-1">
              Hạn nộp:{' '}
              {new Date(conference.submissionDeadline).toLocaleDateString(
                'vi-VN',
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
          >
            {isExpanded ? 'Ẩn chủ đề' : 'Xem chủ đề'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {tracksLoading ? (
            <div className="flex justify-center items-center py-2">
              <CircularProgress size={20} disableShrink />
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có chủ đề nào</p>
          ) : (
            <div className="w-full">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Các chủ đề:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:border-teal-300 transition-colors"
                  >
                    <span className="text-sm text-gray-800">{track.name}</span>
                    <button
                      onClick={() => onSubmit(conference.id, track.id)}
                      className="p-3 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors cursor-pointer"
                    >
                      Nộp bài
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionLanding;
