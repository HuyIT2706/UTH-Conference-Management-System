import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGetConferenceByIdQuery, useGetPublicTracksQuery } from '../../redux/api/conferencesApi';
import { useCreateSubmissionMutation, useGetSubmissionByIdQuery, useUpdateSubmissionMutation } from '../../redux/api/submissionsApi';
import { formatApiError } from '../../utils/api-helpers';
import { showToast } from '../../utils/toast';
import StudentSubmissionsList from '../../components/StudentSubmissionsList';
import type { Track } from '../../types/api.types';

interface CoAuthor {
  name: string;
  email: string;
  affiliation?: string;
}

const StudentSubmitForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const conferenceId = parseInt(searchParams.get('conferenceId') || '0');
  const trackIdParam = searchParams.get('trackId');
  const trackId = trackIdParam ? parseInt(trackIdParam) : undefined;
  const submissionId = searchParams.get('submissionId') || undefined;
  const isEditMode = !!submissionId;

  const { data: conferenceData, isLoading: conferenceLoading } = useGetConferenceByIdQuery(conferenceId, {
    skip: !conferenceId,
  });
  const { data: tracksData } = useGetPublicTracksQuery(conferenceId, {
    skip: !conferenceId,
  });
  const { data: submissionData, isLoading: submissionLoading } = useGetSubmissionByIdQuery(submissionId!, {
    skip: !submissionId,
  });

  const conference = conferenceData?.data;
  const tracks: Track[] = tracksData?.data || [];
  const selectedTrack = trackId ? tracks.find((t) => t.id === trackId) : undefined;
  const submission = submissionData?.data;

  const [createSubmission, { isLoading: isSubmitting }] = useCreateSubmissionMutation();
  const [updateSubmission, { isLoading: isUpdating }] = useUpdateSubmissionMutation();

  // Form state
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<number | undefined>(trackId);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!conferenceId) {
      showToast.error('Vui lòng chọn hội nghị');
      navigate('/student');
    }
  }, [conferenceId, navigate]);

  // Load submission data when editing
  useEffect(() => {
    if (submission && isEditMode) {
      setTitle(submission.title);
      setAbstract(submission.abstract);
      setKeywords(submission.keywords || '');
      setSelectedTrackId(submission.trackId);
      if (submission.fileUrl) {
        setFilePreview('File đã tải lên');
      }
      if (submission.coAuthors && submission.coAuthors.length > 0) {
        setCoAuthors(submission.coAuthors);
      }
    }
  }, [submission, isEditMode]);

  const calculateDaysLeft = (deadline: string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/zip', // .zip
    ];
    const validExtensions = ['.pdf', '.docx', '.doc', '.zip'];
    const fileName = file.name.toLowerCase();
    
    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!isValidFileType(selectedFile)) {
        showToast.error('Chỉ chấp nhận file PDF, DOCX, DOC hoặc ZIP');
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        showToast.error('File không được vượt quá 20MB');
        return;
      }
      setFile(selectedFile);
      setFilePreview(selectedFile.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!isValidFileType(droppedFile)) {
        showToast.error('Chỉ chấp nhận file PDF, DOCX, DOC hoặc ZIP');
        return;
      }
      if (droppedFile.size > 20 * 1024 * 1024) {
        showToast.error('File không được vượt quá 20MB');
        return;
      }
      setFile(droppedFile);
      setFilePreview(droppedFile.name);
    }
  };

  const addCoAuthor = () => {
    setCoAuthors([...coAuthors, { name: '', email: '', affiliation: '' }]);
  };

  const removeCoAuthor = (index: number) => {
    setCoAuthors(coAuthors.filter((_, i) => i !== index));
  };

  const updateCoAuthor = (index: number, field: keyof CoAuthor, value: string) => {
    const updated = [...coAuthors];
    updated[index] = { ...updated[index], [field]: value };
    setCoAuthors(updated);
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!conferenceId) {
      showToast.error('Vui lòng chọn hội nghị');
      return;
    }

    if (!selectedTrackId) {
      showToast.error('Vui lòng chọn chủ đề (track)');
      return;
    }

    // Check deadline trước khi submit
    if (!saveAsDraft && isDeadlinePassed) {
      showToast.error('Hạn nộp bài đã qua. Vui lòng liên hệ ban tổ chức nếu cần hỗ trợ.');
      return;
    }

    if (!saveAsDraft) {
      if (!title.trim()) {
        showToast.error('Vui lòng nhập tiêu đề bài viết');
        return;
      }
      if (!abstract.trim()) {
        showToast.error('Vui lòng nhập tóm tắt');
        return;
      }
      if (!file) {
        showToast.error('Vui lòng tải lên file (PDF, DOCX, DOC hoặc ZIP)');
        return;
      }
    }

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('title', title || 'Draft');
      formData.append('abstract', abstract || '');
      if (keywords) {
        formData.append('keywords', keywords);
      }
      formData.append('trackId', selectedTrackId.toString());
      formData.append('conferenceId', conferenceId.toString());
      formData.append('isDraft', saveAsDraft.toString());

      // Note: coAuthors không được hỗ trợ trong backend hiện tại
      // Có thể thêm sau khi backend hỗ trợ
      // if (coAuthors.length > 0) {
      //   const validCoAuthors = coAuthors.filter((ca) => ca.name && ca.email);
      //   if (validCoAuthors.length > 0) {
      //     formData.append('coAuthors', JSON.stringify(validCoAuthors));
      //   }
      // }

      if (isEditMode && submissionId) {
        // Update existing submission
        await updateSubmission({
          id: submissionId,
          data: {
            title: title || 'Draft',
            abstract: abstract || '',
            keywords: keywords || undefined,
            trackId: selectedTrackId!,
          },
          file: file || undefined,
        }).unwrap();
        showToast.success(saveAsDraft ? 'Đã cập nhật bản nháp thành công' : 'Đã cập nhật bài nộp thành công');
      } else {
        // Create new submission
        await createSubmission(formData).unwrap();
        showToast.success(saveAsDraft ? 'Đã lưu bản nháp thành công' : 'Nộp bài thành công');
      }
      navigate('/student');
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  const isLoading = isSubmitting || isUpdating;

  if (conferenceLoading) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-red-600">Không tìm thấy hội nghị</div>
        </div>
      </div>
    );
  }

  const submissionDeadline = conference.cfpSetting?.submissionDeadline || conference.submissionDeadline;
  const daysLeft = submissionDeadline ? calculateDaysLeft(submissionDeadline) : 0;
  const isDeadlinePassed = submissionDeadline ? new Date() > new Date(submissionDeadline) : false;

  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Submissions List */}
        <StudentSubmissionsList />

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isEditMode ? 'Chỉnh sửa bài nộp' : 'Nộp Bài'}
              </h1>
              <p className="text-gray-600">
                {isEditMode
                  ? 'Chỉnh sửa thông tin bài nghiên cứu của bạn'
                  : 'Vui lòng điền đầy đủ thông tin bên dưới để nộp bài nghiên cứu của bạn'}
              </p>
            </div>
            {submissionDeadline && (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Hạn chót nộp bài</div>
                <div className="text-lg font-semibold text-gray-800">
                  {new Date(submissionDeadline).toLocaleDateString('vi-VN')}
                </div>
                {isDeadlinePassed ? (
                  <div className="text-sm text-red-600 font-medium">Đã hết hạn</div>
                ) : (
                  <div className="text-sm text-teal-600 font-medium">Còn {daysLeft} ngày</div>
                )}
              </div>
            )}
          </div>

          {/* Status Bar
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">• Bản nháp</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                Chỉnh sửa
              </button>
              <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
                Rút bài
              </button>
            </div>
          </div> */}
          
          {/* Deadline Warning */}
          {isDeadlinePassed && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Hạn nộp bài đã qua</h3>
                  <p className="text-red-700 text-sm">
                    Hạn nộp bài là {new Date(submissionDeadline!).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}. Bạn không thể nộp bài mới nữa. Vui lòng liên hệ ban tổ chức nếu cần hỗ trợ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Article Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin bài viết</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề của bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề nghiên cứu của bạn"
                  className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tóm tắt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Nhập tóm tắt nghiên cứu (200 - 300 từ)"
                  rows={6}
                  className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ khóa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Nhập các từ khóa, phân cách bằng dấu phẩy"
                  className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ví dụ: machine learning, artificial intelligence, deep learning
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ đề (Track) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTrackId || ''}
                  onChange={(e) => setSelectedTrackId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Chọn chủ đề</option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Author Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin tác giả chính</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={user?.fullName || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổ chức/Trường đại học<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Tên trường đại học hoặc tổ chức"
                  className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Co-authors */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Đồng tác giả</h2>
              <button
                onClick={addCoAuthor}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                + Thêm đồng tác giả
              </button>
            </div>
            <div className="space-y-4">
              {coAuthors.map((coAuthor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Đồng tác giả {index + 1}</span>
                    <button
                      onClick={() => removeCoAuthor(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        value={coAuthor.name}
                        onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                        placeholder="Họ và tên"
                        className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={coAuthor.email}
                        onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tổ chức/ Trường đại học</label>
                      <input
                        type="text"
                        value={coAuthor.affiliation || ''}
                        onChange={(e) => updateCoAuthor(index, 'affiliation', e.target.value)}
                        placeholder="Tên tổ chức hoặc trường đại học"
                        className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tải lên file</h2>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors"
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    {filePreview || 'hoặc kéo thả file vào đây'}
                  </p>
                  <p className="text-sm text-gray-500">Chỉ chấp nhận file PDF, DOCX, DOC hoặc ZIP, tối đa 20MB</p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isEditMode ? 'Cập nhật bản nháp' : 'Lưu bản nháp'}
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isLoading || isDeadlinePassed}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? 'Đang xử lý...'
                : isDeadlinePassed
                ? 'Đã hết hạn nộp bài'
                : isEditMode
                ? 'Cập nhật bài nộp'
                : 'Nộp bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubmitForm;

