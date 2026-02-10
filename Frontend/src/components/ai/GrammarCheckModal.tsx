import { useState, useEffect } from 'react';
import { aiApi } from '../../services/aiApi';
import type { CheckGrammarDto, GrammarCheckResponse } from '../../services/aiApi';
import { showToast } from '../../utils/toast';
import CircularProgress from '@mui/material/CircularProgress';

interface GrammarCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  textToCheck: string;
  type: 'abstract' | 'title' | 'content';
  onApplyCorrection: (correctedText: string) => void;
}

const GrammarCheckModal = ({ isOpen, onClose, textToCheck, type, onApplyCorrection }: GrammarCheckModalProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titleMap: Record<GrammarCheckModalProps['type'], string> = {
    title: 'Kiểm tra Tiêu đề (AI)',
    abstract: 'Kiểm tra Tóm tắt (AI)',
    content: 'Kiểm tra Nội dung (AI)',
  };

  // This useEffect is responsible for triggering the grammar check when the modal opens or text changes.
  // It is not redundant as it handles side effects based on component lifecycle and prop changes.
  // The provided "Code Edit" attempts to move this logic into a useState initialization, which is syntactically incorrect
  // and misuses React hooks. Therefore, the useEffect must remain as it is.
  useEffect(() => {
    if (isOpen && textToCheck) {
      // Reset state when opening or text changes
      setResult(null);
      setError(null);
      
      // Auto trigger check
      const performCheck = async () => {
        setLoading(true);
        try {
          const response = await aiApi.checkGrammar({ text: textToCheck, type });
          setResult(response);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Lỗi kết nối');
          showToast.error('Lỗi khi kiểm tra ngữ pháp: ' + (err.response?.status === 404 ? 'API chưa sẵn sàng (404)' : err.message));
        } finally {
          setLoading(false);
        }
      };
      
      performCheck();
    }
  }, [isOpen, textToCheck]); // Run when modal opens or text changes

  // Handler for retry button
  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiApi.checkGrammar({ text: textToCheck, type });
      setResult(response);
    } catch (err: any) {
       setError(err.message || 'Lỗi kết nối');
       showToast.error('Lỗi thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyCorrection(result.corrected);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-2xl px-4 sm:px-0">
      <div className="bg-white rounded-xl shadow-2xl border border-teal-100 p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {titleMap[type]}
            </h2>
            {type === 'abstract' && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Gợi ý: Tóm tắt nên cô đọng 200–300 từ, nêu rõ vấn đề, phương pháp và kết quả chính.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <CircularProgress />
            <p className="mt-4 text-gray-600">Đang phân tích văn bản...</p>
          </div>
        )}

        {!loading && !result && error && (
             <div className="text-center py-8">
                <p className="text-red-500 mb-4">Không thể kết nối đến AI Service ({error})</p>
                <p className="text-gray-500 text-sm mb-4">Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.</p>
                <button
                  onClick={handleRetry}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                >
                  Thử lại
                </button>
             </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Điểm số:</span>
              <span className={`px-3 py-1 rounded-full text-white ${
                result.score >= 90 ? 'bg-green-500' : result.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {result.score}/100
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-semibold mb-2">Văn bản gốc:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{result.original}</p>
            </div>

            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">Văn bản chỉnh sửa:</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{result.corrected}</p>
            </div>

            {result.corrections.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Chi tiết lỗi:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {result.corrections.map((item, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="text-red-600 line-through mr-2">{item.error}</span>
                      <span className="text-green-600 font-medium mr-2">{item.correction}</span>
                      <span className="text-gray-500">({item.explanation})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Áp dụng chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarCheckModal;
