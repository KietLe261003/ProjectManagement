import { useCurrentUserProfile, useUpdateUserProfile } from '@/services/userService';
import { LoadingSpinner } from '@/components';
import { toast } from 'sonner';

const UserPreferences = () => {
  const { currentUserProfile, isLoading, error, mutate } = useCurrentUserProfile();
  const { updateProfile, loading: updateLoading } = useUpdateUserProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Có lỗi xảy ra khi tải tùy chỉnh
      </div>
    );
  }

  const handlePreferenceUpdate = async (field: string, value: any) => {
    if (!currentUserProfile) return;

    try {
      await updateProfile(currentUserProfile.name, { [field]: value });
      toast.success('Tùy chỉnh đã được cập nhật thành công');
      mutate(); // Refresh user data
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật tùy chỉnh');
      console.error('Update preference error:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tùy chỉnh giao diện
      </h3>
      
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Giao diện
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Light', 'Dark', 'Automatic'].map((theme) => (
              <button
                key={theme}
                onClick={() => handlePreferenceUpdate('desk_theme', theme)}
                disabled={updateLoading}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  currentUserProfile?.desk_theme === theme
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {theme === 'Light' && '☀️ Sáng'}
                {theme === 'Dark' && '🌙 Tối'}
                {theme === 'Automatic' && '🔄 Tự động'}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cài đặt thông báo
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.notifications}
                onChange={(e) => handlePreferenceUpdate('notifications', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Nhận thông báo</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.mute_sounds}
                onChange={(e) => handlePreferenceUpdate('mute_sounds', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Tắt âm thanh thông báo</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.document_follow_notify}
                onChange={(e) => handlePreferenceUpdate('document_follow_notify', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Thông báo tài liệu theo dõi</span>
            </label>
          </div>
        </div>

        {/* UI Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tùy chỉnh giao diện
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.search_bar}
                onChange={(e) => handlePreferenceUpdate('search_bar', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Hiển thị thanh tìm kiếm</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.list_sidebar}
                onChange={(e) => handlePreferenceUpdate('list_sidebar', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Hiển thị sidebar danh sách</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.form_sidebar}
                onChange={(e) => handlePreferenceUpdate('form_sidebar', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Hiển thị sidebar form</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.timeline}
                onChange={(e) => handlePreferenceUpdate('timeline', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Hiển thị timeline</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.dashboard}
                onChange={(e) => handlePreferenceUpdate('dashboard', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Hiển thị dashboard</span>
            </label>
          </div>
        </div>

        {/* Email Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cài đặt email
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.send_me_a_copy}
                onChange={(e) => handlePreferenceUpdate('send_me_a_copy', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Gửi bản sao email cho tôi</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!currentUserProfile?.thread_notify}
                onChange={(e) => handlePreferenceUpdate('thread_notify', e.target.checked ? 1 : 0)}
                disabled={updateLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Thông báo email thread</span>
            </label>
          </div>
        </div>
      </div>

      {updateLoading && (
        <div className="mt-4 text-sm text-blue-600 flex items-center">
          <LoadingSpinner />
          <span className="ml-2">Đang cập nhật...</span>
        </div>
      )}
    </div>
  );
};

export default UserPreferences;
