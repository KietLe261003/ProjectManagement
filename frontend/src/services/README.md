# Service Layer Architecture

## 📁 Cấu trúc Services

```
src/services/
├── index.ts              # Main exports
├── projectService.ts     # Project-related API calls
├── userService.ts        # User management API calls
└── docTypeService.ts     # Generic DocType API calls
```

## 🎯 Mục đích

Tránh việc gọi API lặp đi lặp lại trong các component và tập trung quản lý tất cả API calls ở một nơi.

## 🔧 Cách sử dụng

### 1. **Project Service**

```typescript
import { useUserProjects, useProject, useCreateProject } from '@/services';

// Lấy projects của user hiện tại
const { data: projects, isLoading, error } = useUserProjects();

// Lấy chi tiết 1 project
const { data: project, mutate } = useProject(projectName);

// Tạo project mới
const { createProject, isLoading } = useCreateProject();
await createProject(projectData);
```

### 2. **User Service**

```typescript
import { useUsers, useCurrentUser } from '@/services';

// Lấy danh sách users
const { data: users } = useUsers();

// Lấy thông tin user hiện tại
const { currentUser } = useCurrentUser();
```

### 3. **DocType Service**

```typescript
import { useCustomers, useCompanies, useDocTypeOptions } from '@/services';

// Lấy customers
const { data: customers } = useCustomers();

// Lấy companies
const { data: companies } = useCompanies();

// Generic cho bất kỳ doctype nào
const { data: options } = useDocTypeOptions('Custom DocType', {
  fields: ['name', 'title'],
  filters: [['disabled', '=', 0]]
});
```

## ✅ Lợi ích

### **Before (Trước khi có Service Layer)**
```typescript
// Trong ProjectsPage.tsx
const { data: ownedProjects } = useFrappeGetDocList('Project', {...});
const { data: allProjects } = useFrappeGetDocList('Project', {...});

// Trong CreateProject.tsx  
const { createDoc } = useFrappeCreateDoc();

// Trong DetailProject.tsx
const { data: project } = useFrappeGetDoc('Project', projectName);
const { call: insertCall } = useFrappePostCall('frappe.client.insert');

// Code lặp lại ở nhiều nơi!
```

### **After (Sau khi có Service Layer)**
```typescript
// Tất cả components chỉ cần
import { useUserProjects, useCreateProject, useProject } from '@/services';

// Clean, consistent, reusable!
```

## 🔄 Centralized Logic

### **Project Filtering Logic**
- Logic phức tạp để filter projects (owner + member) được tập trung trong `ProjectService.useUserProjects()`
- Tất cả components sử dụng cùng 1 logic, đảm bảo consistency

### **Error Handling**
- Error handling được chuẩn hóa
- Loading states được quản lý tập trung

### **Field Management**
- Standard fields được define trong service
- Dễ dàng thay đổi fields cần fetch

## 📊 API Call Analysis

### **Trước khi refactor:**
```
ProjectsPage.tsx:
- useFrappeGetDocList('Project') x2 calls
- useFrappeAuth() x1 call

CreateProject.tsx:
- useFrappeCreateDoc() x1 call
- Multiple Combobox components calling useFrappeGetDocList

DetailProject.tsx:
- useFrappeGetDoc('Project') x1 call
- useFrappeGetDoc('User') x1 call
- useFrappePostCall() x4 calls
- useFrappeAuth() x1 call

Combobox.tsx (used multiple times):
- useFrappeGetDocList() per each dropdown
```

### **Sau khi refactor:**
```
All components:
- Import từ centralized services
- Consistent API patterns
- Reduced code duplication
- Better type safety
```

## 🛠️ Maintained Components

### **Updated Components:**
1. ✅ `ProjectsPage.tsx` - Uses `useUserProjects()`
2. ✅ `CreateProject.tsx` - Uses `useCreateProject()` 
3. 🔄 `DetailProject.tsx` - Ready for service integration
4. 🔄 `Combobox.tsx` - Can use `useDocTypeOptions()`

### **Ready for Integration:**
- All project-related API calls centralized
- User management centralized  
- DocType options centralized
- Error handling standardized

## 🎯 Next Steps

1. **Cập nhật DetailProject** để sử dụng `useProject()`, `useProjectMembers()`
2. **Cập nhật Combobox** để sử dụng `useDocTypeOptions()` 
3. **Thêm caching** với React Query nếu cần
4. **Thêm optimistic updates** cho better UX

## 🔍 Service Patterns

### **Naming Convention:**
- `use{Entity}{Action}()` - e.g., `useUserProjects()`, `useCreateProject()`
- `{Entity}Service.{method}()` - e.g., `ProjectService.useProject()`

### **Return Pattern:**
```typescript
{
  data: T | undefined,
  isLoading: boolean,
  error: any,
  mutate?: () => void  // For refetching
}
```

### **Error Handling:**
- Consistent error objects
- Loading states properly managed
- Optional success callbacks
