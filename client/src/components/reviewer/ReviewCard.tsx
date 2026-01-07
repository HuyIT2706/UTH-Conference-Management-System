import { memo } from 'react';
import type { Review } from '../../types/api.types';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = memo(({ review }: ReviewCardProps) => {
  const reviewerName = (review as any)?.reviewerName 
    || (review as any)?.assignment?.reviewerName 
    || (review.reviewerId ? `Reviewer #${review.reviewerId}` : 'Reviewer');

  const displayScore = review.score.toFixed(1);

  const recommendationText = review.recommendation === 'ACCEPT' && 'Chấp nhận với sửa nhỏ'
    || review.recommendation === 'WEAK_ACCEPT' && 'Chấp nhận yếu'
    || review.recommendation === 'WEAK_REJECT' && 'Từ chối yếu'
    || review.recommendation === 'REJECT' && 'Từ chối'
    || '';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{reviewerName}</h3>
          <p className="text-sm text-gray-600">{recommendationText}</p>
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
});

ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;

