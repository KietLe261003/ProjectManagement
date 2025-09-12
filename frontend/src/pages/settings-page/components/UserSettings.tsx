import React, { useState, useEffect } from 'react';
import { 
  useCurrentUserProfile, 
  useUpdateUserProfile, 
  useChangePassword, 
  useUploadUserImage
} from '@/services/userService';
import { LoadingSpinner } from '@/components';
import { toast } from 'sonner';
import UserRoles from './UserRoles';
import UserActivityInfo from './UserActivityInfo';
import UserPreferences from './UserPreferences';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile_no?: string;
  bio?: string;
  location?: string;
  gender?: string;
  birth_date?: string;
}

const UserSettings = () => {
  const { currentUserProfile, isLoading, error, mutate } = useCurrentUserProfile();
  const { updateProfile, loading: updateLoading } = useUpdateUserProfile();
  const { changePassword, loading: passwordLoading } = useChangePassword();
  const { uploadImage, loading: uploadLoading } = useUploadUserImage();

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile_no: '',
    bio: '',
    location: '',
    gender: '',
    birth_date: ''
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Load user data when available
  useEffect(() => {
    if (currentUserProfile) {
      setProfileForm({
        first_name: currentUserProfile.first_name || '',
        last_name: currentUserProfile.last_name || '',
        email: currentUserProfile.email || '',
        phone: currentUserProfile.phone || '',
        mobile_no: currentUserProfile.mobile_no || '',
        bio: currentUserProfile.bio || '',
        location: currentUserProfile.location || '',
        gender: currentUserProfile.gender || '',
        birth_date: currentUserProfile.birth_date || ''
      });
      
      if (currentUserProfile.user_image) {
        setImagePreview(currentUserProfile.user_image);
      }
    }
  }, [currentUserProfile]);

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !currentUserProfile) return;

    try {
      await uploadImage(selectedImage, currentUserProfile.name);
      toast.success('Ảnh đại diện đã được cập nhật thành công');
      mutate(); // Refresh user data
      setSelectedImage(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
      console.error('Upload error:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentUserProfile) return;

    try {
      await updateProfile(currentUserProfile.name, profileForm);
      toast.success('Thông tin cá nhân đã được cập nhật thành công');
      mutate(); // Refresh user data
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
      console.error('Update error:', error);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Mật khẩu đã được thay đổi thành công');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thay đổi mật khẩu');
      console.error('Password change error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Có lỗi xảy ra khi tải thông tin người dùng
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Thông tin cá nhân
        </h3>
        
        {/* Avatar Section */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {currentUserProfile?.first_name?.[0]?.toUpperCase() || 'U'}
                {currentUserProfile?.last_name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-3 cursor-pointer inline-block"
            >
              Chọn ảnh
            </label>
            {selectedImage && (
              <button
                onClick={handleImageUpload}
                disabled={uploadLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mr-3 disabled:opacity-50"
              >
                {uploadLoading ? 'Đang tải...' : 'Cập nhật ảnh'}
              </button>
            )}
            <button
              onClick={() => {
                setImagePreview('');
                setSelectedImage(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              Xóa ảnh
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ
            </label>
            <input
              type="text"
              value={profileForm.first_name}
              onChange={(e) => handleProfileChange('first_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên
            </label>
            <input
              type="text"
              value={profileForm.last_name}
              onChange={(e) => handleProfileChange('last_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="text"
              value={profileForm.phone || ''}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số di động
            </label>
            <input
              type="text"
              value={profileForm.mobile_no || ''}
              onChange={(e) => handleProfileChange('mobile_no', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới tính
            </label>
            <select
              value={profileForm.gender || ''}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày sinh
            </label>
            <input
              type="date"
              value={profileForm.birth_date || ''}
              onChange={(e) => handleProfileChange('birth_date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <input
              type="text"
              value={profileForm.location || ''}
              onChange={(e) => handleProfileChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới thiệu bản thân
            </label>
            <textarea
              value={profileForm.bio || ''}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button 
          onClick={handleProfileUpdate}
          disabled={updateLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {updateLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
        </button>
      </div>

      {/* Password Change Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Thay đổi mật khẩu
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={handlePasswordUpdate}
            disabled={passwordLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </div>

      {/* User Roles Section */}
      <UserRoles />
      
      {/* User Activity Info Section */}
      <UserActivityInfo />
      
      {/* User Preferences Section */}
      <UserPreferences />
    </div>
  );
};

export default UserSettings;
