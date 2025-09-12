import { useCurrentUserProfile } from '@/services/userService';
import { LoadingSpinner } from '@/components';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const UserActivityInfo = () => {
  const { currentUserProfile, isLoading, error } = useCurrentUserProfile();

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
        Có lỗi xảy ra khi tải thông tin hoạt động
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thông tin hoạt động
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lần đăng nhập cuối
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(currentUserProfile?.last_login)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hoạt động cuối
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(currentUserProfile?.last_active)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ngày tạo tài khoản
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(currentUserProfile?.creation)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái tài khoản
            </label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              currentUserProfile?.enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentUserProfile?.enabled ? 'Hoạt động' : 'Bị vô hiệu hóa'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Loại người dùng
          </label>
          <p className="text-sm text-gray-900 mt-1">
            {currentUserProfile?.user_type || 'Chưa xác định'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserActivityInfo;
