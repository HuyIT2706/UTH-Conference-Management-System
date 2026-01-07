import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetConferencesQuery } from '../../redux/api/conferencesApi';
import ConferenceCard from '../../components/student/ConferenceCard';
import type { Conference } from '../../types/api.types';

const StudentSubmissionLanding = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetConferencesQuery();
  const conferences: Conference[] = data?.data || [];
  const [expandedConference, setExpandedConference] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="p-6 flex justify-center items-center">
        <CircularProgress disableShrink />
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Lỗi tải dữ liệu</div>;

  const handleSubmit = (conferenceId: number, trackId?: number) => {
    if (trackId) {
      navigate(`/student/submit?conferenceId=${conferenceId}&trackId=${trackId}`);
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

        <div className="border-2 border-solid border-teal-200 rounded-lg p-5 space-y-5">
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

export default StudentSubmissionLanding;
