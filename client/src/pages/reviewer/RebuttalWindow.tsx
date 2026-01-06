import CircularProgress from '@mui/material/CircularProgress';
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

  const calculateDaysLeft = (deadline: string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!submission) {
    return (
      <div className="flex justify-center items-center py-8">
        <CircularProgress disableShrink />
      </div>
    );
  }

  const submissionDeadline = submission.submissionDeadline;
  const daysLeft = submissionDeadline ? calculateDaysLeft(submissionDeadline) : 0;

  // Calculate statistics
  const totalReviews = reviews.length;
  // Score is 0-10 scale
  const averageScore = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / totalReviews).toFixed(1)
    : '0.0';

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
        {reviews.map((review) => {
          // Get reviewer name from API response (enriched by backend)
          const reviewerName = (review as any)?.reviewerName 
            || (review as any)?.assignment?.reviewerName 
            || (review.reviewerId ? `Reviewer #${review.reviewerId}` : 'Reviewer');

          // Score is 0-10 scale
          const displayScore = review.score.toFixed(1);

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
                  {displayScore}/10
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{review.commentForAuthor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RebuttalWindow;


