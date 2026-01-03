import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetTrackMembersQuery,
  useDeleteTrackMemberMutation,
} from '../../../redux/api/conferencesApi';
import { useGetUsersQuery } from '../../../redux/api/usersApi';
import type { TrackMember, User } from '../../../types/api.types';
import { showToast } from '../../../utils/toast';
import PCMemberList from './PCMemberList';
import CreatePCMemberForm from './CreatePCMemberForm';

interface PCMemberDetailProps {
  trackId: number;
  onBack: () => void;
}

const PCMemberDetail = ({
  trackId,
  onBack,
}: PCMemberDetailProps) => {
  const { data: membersData, isLoading } = useGetTrackMembersQuery(trackId);
  const [deleteMember] = useDeleteTrackMemberMutation();
  const { data: usersData } = useGetUsersQuery();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const members = membersData?.data && Array.isArray(membersData.data) ? membersData.data : [];
  const users = usersData?.data && Array.isArray(usersData.data) ? usersData.data : [];

  // Get user info for each member
  const membersWithUserInfo = members.map((member: TrackMember) => {
    const user = users.find((u: User) => u.id === member.userId);
    return {
      ...member,
      user: user || null,
    };
  });

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi chủ đề không?')) {
      return;
    }

    try {
      await deleteMember({ trackId, userId }).unwrap();
      showToast.success('Xóa thành viên thành công');
    } catch (err) {
      console.error('Error deleting member:', err);
      showToast.error('Có lỗi xảy ra khi xóa thành viên');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Danh sách Ban Chương trình</h2>
        <div className="flex items-center gap-3">
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              + Thêm thành viên
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>

      {showCreateForm && (
        <CreatePCMemberForm
          trackId={trackId}
          existingMemberIds={members.map((m: TrackMember) => m.userId)}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <PCMemberList
        members={membersWithUserInfo}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default PCMemberDetail;

