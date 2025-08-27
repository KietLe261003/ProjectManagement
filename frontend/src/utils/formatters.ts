export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const getStatusClass = (status: string): string => {
  // Chuẩn hóa màu sắc theo ProjectOverview
  switch (status) {
    case 'Open':
    case 'Đang mở':
      return 'bg-blue-100 text-blue-800';
    case 'Working':
    case 'Đang thực hiện':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
    case 'Hoàn thành':
      return 'bg-green-100 text-green-800';
    case 'Overdue':
    case 'Quá hạn':
    case 'Sắp đến hạn':
      return 'bg-red-100 text-red-800';
    case 'Cancelled':
    case 'Hủy':
    case 'Đã hủy':
      return 'bg-gray-100 text-gray-800';
    case 'Đang xem xét':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityClass = (priority: string): string => {
  // Chuẩn hóa màu sắc theo ProjectOverview
  switch (priority) {
    case 'Urgent':
    case 'Khẩn cấp':
      return 'bg-red-100 text-red-800';
    case 'High':
    case 'Cao':
      return 'bg-orange-100 text-red-800';
    case 'Medium':
    case 'Trung bình':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
    case 'Thấp':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
