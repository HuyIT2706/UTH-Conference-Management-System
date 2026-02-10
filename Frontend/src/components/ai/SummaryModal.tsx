import { useState, useEffect } from 'react';
import { aiApi } from '../../services/aiApi';
import type { SummaryResponse } from '../../services/aiApi';
import { showToast } from '../../utils/toast';
import CircularProgress from '@mui/material/CircularProgress';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
}

const SummaryModal = ({ isOpen, onClose, submissionId }: SummaryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    if (isOpen && submissionId) {
      loadSummary();
    }
  }, [isOpen, submissionId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // Try to get existing summary first
      const existing = await aiApi.getSummary(submissionId);
      if (existing) {
        setSummary(existing);
      } else {
        // If not exists, define how to handle. For now, show "Create" button or auto-create.
        // Let's allow user to trigger creation.
        setSummary(null);
      }
    } catch (error) {
      console.error(error);
      // If 404, it means no summary.
    } finally {
      setLoading(false);
    }
  };


  
  // Re-read backend ai.service.ts
  // Backend summarizeSubmission takes DTO with title, abstract, content.
  // So we MUST pass these to generate.
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Tóm tắt bài báo (AI)</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <CircularProgress />
          </div>
        )}

        {!loading && !summary && (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có tóm tắt AI cho bài viết này.</p>
            {/* <button onClick={handleGenerate} ... >Tạo tóm tắt</button> */} 
            {/* Disabled generation for now as we need full text */ }
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-1">Tóm tắt chung</h3>
              <p className="text-gray-800">{summary.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-3 rounded border border-red-100">
                    <h4 className="font-semibold text-red-800 text-sm mb-1">Vấn đề</h4>
                    <p className="text-sm text-gray-700">{summary.problem}</p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-100">
                    <h4 className="font-semibold text-green-800 text-sm mb-1">Giải pháp</h4>
                    <p className="text-sm text-gray-700">{summary.solution}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded border border-purple-100">
                    <h4 className="font-semibold text-purple-800 text-sm mb-1">Kết quả</h4>
                    <p className="text-sm text-gray-700">{summary.result}</p>
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Từ khóa AI:</h3>
                 <div className="flex flex-wrap gap-2">
                    {summary.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-200 rounded text-sm text-gray-700">
                            {kw}
                        </span>
                    ))}
                 </div>
            </div>
            
            <div className="text-right text-xs text-gray-400 mt-4">
                Được tạo lúc: {new Date(summary.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
