export interface DateValidationResult {
  isValid: boolean;
  errors: {
    startDate?: string;
    endDate?: string;
  };
}

export interface DateValidationOptions {
  startDateLabel?: string;
  endDateLabel?: string;
  errorMessages?: {
    startDateError?: string;
    endDateError?: string;
  };
}

/**
 * Validates that end date is after start date
 * @param startDate - Start date string (YYYY-MM-DD format)
 * @param endDate - End date string (YYYY-MM-DD format)
 * @param options - Customization options for labels and error messages
 * @returns ValidationResult with isValid flag and error messages
 */
export const validateDateRange = (
  startDate?: string,
  endDate?: string,
  options: DateValidationOptions = {}
): DateValidationResult => {
  const {
    startDateLabel = 'Ngày Bắt đầu',
    endDateLabel = 'Ngày Kết thúc',
    errorMessages = {}
  } = options;

  const defaultStartError = `${startDateLabel} phải trước ${endDateLabel}`;
  const defaultEndError = `${endDateLabel} phải sau ${startDateLabel}`;

  const result: DateValidationResult = {
    isValid: true,
    errors: {}
  };

  // If either date is missing, consider it valid (optional dates)
  if (!startDate || !endDate) {
    return result;
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      result.isValid = false;
      result.errors.startDate = 'Ngày không hợp lệ';
      result.errors.endDate = 'Ngày không hợp lệ';
      return result;
    }

    // Check if end date is after start date
    if (end <= start) {
      result.isValid = false;
      result.errors.startDate = errorMessages.startDateError || defaultStartError;
      result.errors.endDate = errorMessages.endDateError || defaultEndError;
    }
  } catch (error) {
    result.isValid = false;
    result.errors.startDate = 'Lỗi xử lý ngày';
    result.errors.endDate = 'Lỗi xử lý ngày';
  }

  return result;
};

/**
 * Validates date range for Project
 */
export const validateProjectDates = (expectedStartDate?: string, expectedEndDate?: string) => {
  return validateDateRange(expectedStartDate, expectedEndDate, {
    startDateLabel: 'Ngày Bắt đầu',
    endDateLabel: 'Ngày Kết thúc'
  });
};

/**
 * Validates date range for Phase
 */
export const validatePhaseDates = (startDate?: string, endDate?: string) => {
  return validateDateRange(startDate, endDate, {
    startDateLabel: 'Ngày Bắt đầu',
    endDateLabel: 'Ngày Kết thúc'
  });
};

/**
 * Validates date range for Task
 */
export const validateTaskDates = (startDate?: string, endDate?: string) => {
  return validateDateRange(startDate, endDate, {
    startDateLabel: 'Ngày Bắt đầu',
    endDateLabel: 'Ngày Kết thúc'
  });
};

/**
 * Validates date range for SubTask
 */
export const validateSubTaskDates = (startDate?: string, endDate?: string) => {
  return validateDateRange(startDate, endDate, {
    startDateLabel: 'Ngày Bắt đầu',
    endDateLabel: 'Ngày Kết thúc'
  });
};

/**
 * Generic validation hook for React components
 */
export const useDateValidation = () => {
  const validateAndSetErrors = (
    setValidationErrors: (fn: (prev: any) => any) => void,
    startDate?: string,
    endDate?: string,
    options: DateValidationOptions = {}
  ) => {
    const validationResult = validateDateRange(startDate, endDate, options);
    
    setValidationErrors((prev: any) => ({
      ...prev,
      expected_start_date: validationResult.errors.startDate || '',
      expected_end_date: validationResult.errors.endDate || '',
      start_date: validationResult.errors.startDate || '',
      end_date: validationResult.errors.endDate || ''
    }));

    return validationResult;
  };

  return {
    validateAndSetErrors,
    validateDateRange,
    validateProjectDates,
    validatePhaseDates,
    validateTaskDates,
    validateSubTaskDates
  };
};
