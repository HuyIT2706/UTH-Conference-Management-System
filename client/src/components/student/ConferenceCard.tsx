import { useGetPublicTracksQuery } from '../../redux/api/conferencesApi';
import CircularProgress from '@mui/material/CircularProgress';
import type { Conference, Track } from '../../types/api.types';

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
  const { data: tracksData, isLoading: tracksLoading } = useGetPublicTracksQuery(
    conference.id,
    {
      skip: !isExpanded,
    },
  );
  const tracks: Track[] = tracksData?.data || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-gray-800">{conference.name}</h2>
          {conference.submissionDeadline && (
            <p className="text-sm text-gray-500 mt-1">
              Hạn nộp:{' '}
              {new Date(conference.submissionDeadline).toLocaleDateString('vi-VN')}
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
              <p className="text-sm font-medium text-gray-700 mb-2">Các chủ đề:</p>
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

export default ConferenceCard;


