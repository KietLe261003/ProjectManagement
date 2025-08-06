export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Đang thực hiện': 'status-dang-thuc-hien',
    'Hoàn thành': 'status-hoan-thanh',
    'Hủy': 'status-huy',
    'Đang xem xét': 'status-dang-xem-xet',
    'Sắp đến hạn': 'status-sap-den-han'
  };
  return statusMap[status] || '';
};

export const getPriorityClass = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'Thấp': 'priority-thap',
    'Trung bình': 'priority-trung-binh',
    'Cao': 'priority-cao',
    'Khẩn cấp': 'priority-khan-cap'
  };
  return priorityMap[priority] || '';
};
