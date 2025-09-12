# Trang Cá Nhân Người Dùng - Tích Hợp ERPNext

## Tổng quan
Trang cá nhân người dùng đã được tích hợp hoàn toàn với ERPNext API để cung cấp trải nghiệm quản lý thông tin cá nhân toàn diện.

## Các API được tích hợp

### 1. User Profile API
- **GET User Profile**: Lấy thông tin chi tiết người dùng hiện tại
- **UPDATE User Profile**: Cập nhật thông tin cá nhân
- **Upload User Image**: Tải ảnh đại diện lên server
- **Change Password**: Thay đổi mật khẩu

### 2. User Roles API  
- **GET User Roles**: Lấy danh sách vai trò của người dùng
- **GET User Permissions**: Lấy quyền hạn của người dùng

### 3. Department API
- **GET Departments**: Lấy danh sách phòng ban (từ docTypeService)

## Các Service được tối ưu hóa

### UserService (Mở rộng)
File: `/src/services/userService.ts`

**API được gọi nhiều đã được service hóa:**
- `useCurrentUserProfile()` - Lấy thông tin profile đầy đủ
- `useUpdateUserProfile()` - Cập nhật profile 
- `useChangePassword()` - Đổi mật khẩu
- `useUploadUserImage()` - Tải ảnh đại diện
- `useUserRoles()` - Lấy vai trò user
- `useUserPermissions()` - Lấy quyền hạn user

**Ưu điểm của việc service hóa:**
- Tái sử dụng code dễ dàng
- Quản lý state tập trung  
- Error handling nhất quán
- Loading state được handle tự động
- Dễ testing và maintain

## Các Component được tạo

### 1. UserSettings (Component chính)
File: `/src/pages/settings-page/components/UserSettings.tsx`

**Chức năng:**
- Form cập nhật thông tin cá nhân
- Upload và quản lý ảnh đại diện
- Form đổi mật khẩu với validation
- Tích hợp toast notifications

### 2. UserRoles
File: `/src/pages/settings-page/components/UserRoles.tsx`

**Chức năng:**
- Hiển thị danh sách vai trò của người dùng
- UI dạng badges/tags
- Loading và error states

### 3. UserActivityInfo  
File: `/src/pages/settings-page/components/UserActivityInfo.tsx`

**Chức năng:**
- Hiển thị thông tin hoạt động (last login, last active)
- Thông tin tài khoản (ngày tạo, trạng thái)
- Format ngày tháng theo locale Việt Nam

### 4. UserPreferences
File: `/src/pages/settings-page/components/UserPreferences.tsx`

**Chức năng:**
- Cài đặt giao diện (theme: light/dark/auto)
- Tùy chỉnh thông báo
- Cài đặt UI components (sidebar, timeline, dashboard)
- Cài đặt email preferences

## Tối ưu hóa API Calls

### Các API được gọi nhiều nhất:
1. **User Profile API** - Được gọi ở nhiều component
   - ✅ Đã tối ưu bằng `useCurrentUserProfile()` 
   - Cache và mutate data thông qua SWR

2. **User Update API** - Gọi khi cập nhật profile/preferences  
   - ✅ Đã tối ưu bằng `useUpdateUserProfile()`
   - Tái sử dụng cho cả profile và preferences

3. **Upload Image API** - Gọi khi thay đổi avatar
   - ✅ Đã tối ưu bằng `useUploadUserImage()`
   - Handle FormData upload

4. **Password Change API** - Gọi khi đổi mật khẩu
   - ✅ Đã tối ưu bằng `useChangePassword()`
   - Validation và error handling

### Lợi ích của tối ưu hóa:
- **Giảm duplicate code**: Tái sử dụng hooks across components
- **Consistent error handling**: Tất cả API calls có cùng pattern xử lý lỗi  
- **Better UX**: Loading states và success/error notifications nhất quán
- **Maintainable**: Dễ update logic API ở một chỗ
- **Type Safety**: Full TypeScript support với User interface

## Cách sử dụng

```typescript
// Import hooks từ service
import { 
  useCurrentUserProfile, 
  useUpdateUserProfile 
} from '@/services/userService';

// Sử dụng trong component
const { currentUserProfile, isLoading, error, mutate } = useCurrentUserProfile();
const { updateProfile, loading } = useUpdateUserProfile();

// Cập nhật profile
await updateProfile(userId, profileData);
mutate(); // Refresh data
```

## Dependency

- `frappe-react-sdk`: Tích hợp với ERPNext
- `sonner`: Toast notifications  
- `date-fns`: Format ngày tháng
- `react-hook-form`: Form validation (có thể thêm sau)

## Future Improvements

1. **Add validation**: Sử dụng react-hook-form cho validation form
2. **Add caching**: Implement additional caching cho static data
3. **Add offline support**: Cache data for offline usage
4. **Add audit log**: Theo dõi lịch sử thay đổi profile
5. **Add export feature**: Export user data
6. **Add 2FA settings**: Two-factor authentication setup
