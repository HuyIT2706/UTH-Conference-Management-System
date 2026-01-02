import { useState, useEffect } from 'react';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { useCreateReviewMutation } from '../../redux/api/reviewsApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';

interface ReviewFormProps {
  submissionId: string;
  assignmentId: number;
  onComplete: () => void;
  onBack: () => void;
}

const ReviewForm = ({ submissionId, assignmentId, onComplete, onBack }: ReviewFormProps) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId);
  const [createReview, { isLoading }] = useCreateReviewMutation();
  
  const submission = submissionData?.data;
  
  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState<string>('');

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!saveAsDraft) {
      if (!comment.trim()) {
        showToast.error('Vui lòng nhập nhận xét chi tiết');
        return;
      }
      if (!recommendation) {
        showToast.error('Vui lòng chọn đề xuất');
        return;
      }
    }

    try {
      if (!saveAsDraft) {
        await createReview({
          assignmentId,
          score,
          confidence: 'MEDIUM',
          commentForAuthor: comment,
          recommendation: recommendation as 'ACCEPT' | 'WEAK_ACCEPT' | 'REJECT' | 'WEAK_REJECT',
        }).unwrap();
        showToast.success('Đánh giá bài viết thành công');
        onComplete();
      } else {
        showToast.success('Đã lưu bản nháp');
      }
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  if (!submission) {
    return <div className="text-center py-8">Đang tải thông tin bài viết...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Article Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            {submission.id}
          </span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
            Đang đánh giá
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{submission.title}</h2>
        <p className="text-gray-600">Tác giả: {submission.authorName || 'N/A'}</p>
      </div>

      {/* Evaluation Section */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá</h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">1 - Kém</span>
            <span className="text-sm text-gray-600">10 - Xuất sắc</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setScore(num)}
                className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                  score === num
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-teal-400'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Bình luận</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập điểm mạnh, điểm yếu và đề xuất cải thiện..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quyết định</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đề xuất <span className="text-red-500">*</span>
          </label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Chọn đề xuất</option>
            <option value="ACCEPT">Chấp nhận</option>
            <option value="WEAK_ACCEPT">Chấp nhận yếu</option>
            <option value="WEAK_REJECT">Từ chối yếu</option>
            <option value="REJECT">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Lưu bản nháp
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Nộp đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;


