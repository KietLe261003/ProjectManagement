import { useUserRoles, useCurrentUser } from '@/services/userService';
import { LoadingSpinner } from '@/components';

const UserRoles = () => {
  const { currentUser } = useCurrentUser();
  const { roles, isLoading, error } = useUserRoles(currentUser || undefined);

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
        Có lỗi xảy ra khi tải thông tin vai trò
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Vai trò của bạn
      </h3>
      
      {roles && roles.length > 0 ? (
        <div className="space-y-2">
          {roles.map((role, index) => (
            <div
              key={index}
              className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2"
            >
              {role.role}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Chưa có vai trò được gán
        </p>
      )}
      
      <p className="text-xs text-gray-400 mt-4">
        Vai trò quyết định quyền truy cập và chức năng mà bạn có thể sử dụng trong hệ thống.
      </p>
    </div>
  );
};

export default UserRoles;
