import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { useCreateReviewMutation, useGetMyAssignmentsQuery } from '../../redux/api/reviewsApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import type { Review } from '../../types/api.types';

interface ReviewFormProps {
  submissionId: string;
  assignmentId: number;
  onComplete: () => void;
  onBack: () => void;
}

const ReviewForm = ({ submissionId, assignmentId, onComplete, onBack }: ReviewFormProps) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId);
  const { data: assignmentsData } = useGetMyAssignmentsQuery();
  const [createReview, { isLoading }] = useCreateReviewMutation();
  
  const submission = submissionData?.data;
  const assignments = assignmentsData?.data || [];
  const currentAssignment = assignments.find(a => a.id === assignmentId);
  const isCompleted = currentAssignment?.status === 'COMPLETED';
  // Get review from assignment (may need to cast type)
  const existingReview = (currentAssignment as any)?.review as Review | undefined;
  
  // Check assignment dueDate to determine if can edit
  const dueDate = currentAssignment?.dueDate ? new Date(currentAssignment.dueDate) : null;
  const isDeadlinePassed = dueDate ? new Date() > dueDate : false;
  
  // Can edit if not completed, or completed but deadline not passed
  const canEdit = !isCompleted || (isCompleted && !isDeadlinePassed);
  
  // Normalize existing review score from 0-100 to 0-10 if needed (for backward compatibility)
  const normalizeExistingScore = (score?: number): number => {
    if (!score) return 5;
    // If score >= 10, assume it's old 0-100 scale, convert to 0-10
    return score >= 10 ? Math.round(score / 10) : score;
  };
  const [score, setScore] = useState<number>(normalizeExistingScore(existingReview?.score));
  const [comment, setComment] = useState(existingReview?.commentForAuthor || '');
  const [showReview, setShowReview] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast.error('Vui lòng nhập nhận xét chi tiết');
      return;
    }

    try {
      await createReview({
        assignmentId,
        score,
        confidence: 'MEDIUM',
        commentForAuthor: comment,
        recommendation: 'ACCEPT', // Default recommendation, can be changed later by chair
      }).unwrap();
      showToast.success('Đánh giá bài viết thành công');
      onComplete();
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
          {isCompleted ? (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
              Đã hoàn thành
            </span>
          ) : (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
              Đang đánh giá
            </span>
          )}
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
        {isCompleted && (
          <div className={`mb-4 p-3 rounded-lg ${
            canEdit 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <p className={`text-sm ${
              canEdit ? 'text-yellow-700' : 'text-green-700'
            }`}>
              {canEdit 
                ? '✓ Bạn đã nộp đánh giá. Bạn có thể chỉnh sửa trước khi hết hạn phản biện.'
                : isDeadlinePassed
                ? '✓ Bạn đã nộp đánh giá. Đã hết hạn phản biện, không thể chỉnh sửa.'
                : '✓ Bạn đã nộp đánh giá cho bài viết này.'
              }
            </p>
            {dueDate && (
              <p className={`text-xs mt-1 ${
                canEdit ? 'text-yellow-600' : 'text-green-600'
              }`}>
                Hạn nộp: {dueDate.toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">1 - Kém</span>
            <span className="text-sm text-gray-600">10 - Xuất sắc</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => (!isCompleted || canEdit) && setScore(num)}
                disabled={isCompleted && !canEdit}
                className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                  score === num
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-teal-400'
                } ${(isCompleted && !canEdit) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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
            onChange={(e) => (!isCompleted || canEdit) && setComment(e.target.value)}
            disabled={isCompleted && !canEdit}
            placeholder="Nhập điểm mạnh, điểm yếu và đề xuất cải thiện..."
            rows={8}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
              (isCompleted && !canEdit) ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
        </div>
      </div>

      {/* Review Details Section (when completed) */}
      {isCompleted && showReview && existingReview && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá đã nộp</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Điểm số:</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-teal-600">
                  {normalizeExistingScore(existingReview.score)}
                </span>
                <span className="text-sm text-gray-500">/ 10</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Nhận xét:</p>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{existingReview.commentForAuthor}</p>
              </div>
            </div>
            {existingReview.recommendation && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Đề xuất:</p>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                  {existingReview.recommendation === 'ACCEPT' && 'Chấp nhận'}
                  {existingReview.recommendation === 'WEAK_ACCEPT' && 'Chấp nhận yếu'}
                  {existingReview.recommendation === 'WEAK_REJECT' && 'Từ chối yếu'}
                  {existingReview.recommendation === 'REJECT' && 'Từ chối'}
                </span>
              </div>
            )}
            {existingReview.createdAt && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Ngày nộp:</p>
                <p className="text-sm text-gray-600">
                  {new Date(existingReview.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <div className="flex gap-2">
          {isCompleted && !canEdit && (
            <button
              onClick={() => setShowReview(!showReview)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showReview ? 'Ẩn đánh giá' : 'Xem đánh giá'}
            </button>
          )}
          {(canEdit || !isCompleted) && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <CircularProgress size={16} disableShrink />
                  Đang xử lý...
                </span>
              ) : (
                canEdit ? 'Cập nhật đánh giá' : 'Nộp đánh giá'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;


