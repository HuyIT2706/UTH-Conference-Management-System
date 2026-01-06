import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
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

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!saveAsDraft) {
      if (!comment.trim()) {
        showToast.error('Vui lòng nhập nhận xét chi tiết');
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
          recommendation: 'ACCEPT', // Default recommendation, can be changed later by chair
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
    return (
      <div className="flex justify-center items-center py-8">
        <CircularProgress disableShrink />
      </div>
    );
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{submission.title}</h2>
        
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Tác giả:</p>
            <p className="text-gray-600">{submission.authorName || `ID: ${submission.authorId}`}</p>
            {submission.authorAffiliation && (
              <p className="text-sm text-gray-500 mt-1">{submission.authorAffiliation}</p>
            )}
          </div>

          {submission.coAuthors && submission.coAuthors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Đồng tác giả:</p>
              <div className="space-y-1">
                {submission.coAuthors.map((coAuthor, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    <span className="font-medium">{coAuthor.name}</span>
                    {coAuthor.email && <span className="text-gray-500"> ({coAuthor.email})</span>}
                    {coAuthor.affiliation && <span className="text-gray-500"> - {coAuthor.affiliation}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.abstract && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tóm tắt:</p>
              <p className="text-gray-600 whitespace-pre-wrap">{submission.abstract}</p>
            </div>
          )}

          {submission.keywords && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Từ khóa:</p>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.split(',').map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {submission.fileUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">File bài nộp:</p>
              <button
                onClick={() => window.open(submission.fileUrl, '_blank')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tải xuống file PDF
              </button>
            </div>
          )}
        </div>
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
            {isLoading ? (
              <span className="flex items-center gap-2">
                <CircularProgress size={16} disableShrink />
                Đang xử lý...
              </span>
            ) : (
              'Nộp đánh giá'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;


