import { useState } from 'react';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { useGetReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';

interface RebuttalWindowProps {
  submissionId: string;
}

const RebuttalWindow = ({ submissionId }: RebuttalWindowProps) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId);
  const { data: reviewsData } = useGetReviewsForSubmissionQuery(submissionId);
  
  const submission = submissionData?.data;
  const reviews = reviewsData?.data || [];
  
  const [rebuttals, setRebuttals] = useState<Record<number, string>>({});

  const calculateDaysLeft = (deadline: string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleRebuttalChange = (reviewId: number, value: string) => {
    setRebuttals({ ...rebuttals, [reviewId]: value });
  };

  const handleSubmitRebuttal = (reviewId: number) => {
    const rebuttal = rebuttals[reviewId];
    if (!rebuttal?.trim()) {
      return;
    }
    // TODO: Call API to submit rebuttal
    console.log('Submit rebuttal for review', reviewId, rebuttal);
  };

  if (!submission) {
    return <div className="text-center py-8">Đang tải thông tin...</div>;
  }

  const submissionDeadline = submission.submissionDeadline;
  const daysLeft = submissionDeadline ? calculateDaysLeft(submissionDeadline) : 0;

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageScore = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.score, 0) / totalReviews) * 10) / 10
    : 0;
  const respondedCount = Object.keys(rebuttals).filter((id) => rebuttals[Number(id)]?.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Cửa Sổ Phúc Đáp</h1>
        <p className="text-gray-600 mb-4">Đọc nhận xét và gửi phản hồi</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-600">Số phản biện</p>
              <p className="text-2xl font-bold text-gray-800">{totalReviews}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Điểm trung bình</p>
              <p className="text-2xl font-bold text-gray-800">{averageScore}/10</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã phúc đáp</p>
              <p className="text-2xl font-bold text-gray-800">{respondedCount}/{totalReviews}</p>
            </div>
          </div>
          {submissionDeadline && (
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Hạn chót nộp bài</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date(submissionDeadline).toLocaleDateString('vi-VN')}
              </div>
              <div className="text-sm text-teal-600 font-medium">Còn {daysLeft} ngày</div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => {
          const reviewerName = `Reviewer ${String.fromCharCode(65 + index)}`; // A, B, C...
          const rebuttal = rebuttals[review.id] || '';

          return (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{reviewerName}</h3>
                  <p className="text-sm text-gray-600">
                    {review.recommendation === 'ACCEPT' && 'Chấp nhận với sửa nhỏ'}
                    {review.recommendation === 'WEAK_ACCEPT' && 'Chấp nhận yếu'}
                    {review.recommendation === 'WEAK_REJECT' && 'Từ chối yếu'}
                    {review.recommendation === 'REJECT' && 'Từ chối'}
                  </p>
                </div>
                <div className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold">
                  {review.score}/10
                </div>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{review.commentForAuthor}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phản hồi của bạn
                </label>
                <textarea
                  value={rebuttal}
                  onChange={(e) => handleRebuttalChange(review.id, e.target.value)}
                  placeholder="Nhập phản hồi của bạn..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
                />
                <button
                  onClick={() => handleSubmitRebuttal(review.id)}
                  disabled={!rebuttal.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Gửi phúc đáp
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RebuttalWindow;

