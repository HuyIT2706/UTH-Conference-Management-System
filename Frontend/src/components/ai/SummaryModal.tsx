import { useState, useEffect } from 'react';
import { aiApi } from '../../services/aiApi';
import type { SummaryResponse } from '../../services/aiApi';
import { showToast } from '../../utils/toast';
import CircularProgress from '@mui/material/CircularProgress';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
  title?: string;
  abstract?: string;
  keywords?: string;
}

const SummaryModal = ({ isOpen, onClose, submissionId, title, abstract, keywords }: SummaryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && submissionId) {
      setSummary(null);
      setError(null);
      loadSummary();
    }
  }, [isOpen, submissionId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await aiApi.getSummary(submissionId);
      if (existing) {
        setSummary(existing);
      } else {
        setSummary(null);
      }
    } catch (err: any) {
      // Axios interceptor transforms errors to { message, statusCode, error }
      // 404 means no summary exists yet - that's expected
      if (err.statusCode !== 404) {
        console.error(err);
        setError(err.message || 'Lỗi kết nối');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!title || !abstract) {
      showToast.error('Thiếu thông tin tiêu đề hoặc tóm tắt của bài nộp!');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await aiApi.summarizeSubmission({
        submissionId,
        title,
        abstract,
      });
      setSummary(result);
      showToast.success('Tạo tóm tắt AI thành công!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tạo tóm tắt');
      showToast.error('Lỗi khi tạo tóm tắt: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!title || !abstract) {
      showToast.error('Thiếu thông tin tiêu đề hoặc tóm tắt của bài nộp!');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await aiApi.regenerateSummary({
        submissionId,
        title,
        abstract,
      });
      setSummary(result);
      showToast.success('Tạo lại tóm tắt AI thành công!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tạo lại tóm tắt');
      showToast.error('Lỗi khi tạo lại tóm tắt: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-teal-100 p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Tóm tắt bài báo (AI)</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              AI sẽ phân tích và tóm tắt nội dung bài nộp tự động.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 rounded-full p-2 hover:bg-gray-100 transition-colors text-lg font-bold leading-none"
            aria-label="Đóng"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {(loading || generating) && (
          <div className="flex flex-col items-center justify-center py-8">
            <CircularProgress />
            <p className="mt-4 text-gray-600">
              {generating ? 'Đang tạo tóm tắt AI...' : 'Đang tải tóm tắt...'}
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && !generating && error && !summary && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Không thể kết nối đến AI Service ({error})</p>
            <p className="text-gray-500 text-sm mb-4">Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.</p>
            <button
              onClick={loadSummary}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* No summary - show generate button */}
        {!loading && !generating && !summary && !error && (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-gray-500 text-base mb-1">Chưa có tóm tắt AI cho bài viết này.</p>
              <p className="text-gray-400 text-sm">Nhấn nút bên dưới để AI tạo tóm tắt tự động.</p>
            </div>
            {title && abstract ? (
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Tạo tóm tắt AI
              </button>
            ) : (
              <p className="text-amber-600 text-sm">
                ⚠ Không thể tạo tóm tắt: thiếu thông tin tiêu đề hoặc tóm tắt bài nộp.
              </p>
            )}
          </div>
        )}

        {/* Summary result */}
        {summary && !loading && !generating && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-1">Tóm tắt chung</h3>
              <p className="text-gray-800">{summary.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <h4 className="font-semibold text-red-800 text-sm mb-1">Vấn đề</h4>
                <p className="text-sm text-gray-700">{summary.problem}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Giải pháp</h4>
                <p className="text-sm text-gray-700">{summary.solution}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-purple-800 text-sm mb-1">Kết quả</h4>
                <p className="text-sm text-gray-700">{summary.result}</p>
              </div>
            </div>

            {keywords && (
              <div>
                <h3 className="font-semibold mb-2">Từ khóa bài nộp:</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.split(',').map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm">
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-right text-xs text-gray-400 mt-4">
              Được tạo lúc: {new Date(summary.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        )}

        {/* Footer buttons - always visible */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Đóng
          </button>
          {summary && !loading && !generating && title && abstract && (
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tạo lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
