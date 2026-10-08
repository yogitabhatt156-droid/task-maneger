const VALID_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

/**
 * Validates task payload
 */
const validateTaskPayload = (payload, isUpdate = false) => {
  const errors = [];
  const cleanData = {};

  if (!isUpdate || payload.title !== undefined) {
    if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
      errors.push('Task title is required and cannot be empty.');
    } else if (payload.title.trim().length > 255) {
      errors.push('Task title cannot exceed 255 characters.');
    } else {
      cleanData.title = payload.title.trim();
    }
  }

  if (payload.description !== undefined) {
    if (payload.description === null || payload.description === '') {
      cleanData.description = null;
    } else if (typeof payload.description !== 'string') {
      errors.push('Task description must be a string.');
    } else if (payload.description.length > 5000) {
      errors.push('Task description cannot exceed 5000 characters.');
    } else {
      cleanData.description = payload.description.trim();
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    } else {
      cleanData.status = payload.status;
    }
  } else if (!isUpdate) {
    cleanData.status = 'Todo';
  }

  if (payload.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(payload.priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    } else {
      cleanData.priority = payload.priority;
    }
  } else if (!isUpdate) {
    cleanData.priority = 'Medium';
  }

  if (payload.category_id !== undefined) {
    cleanData.category_id = payload.category_id ? payload.category_id : null;
  }

  if (payload.due_date !== undefined) {
    if (!payload.due_date) {
      cleanData.due_date = null;
    } else {
      const parsedDate = new Date(payload.due_date);
      if (isNaN(parsedDate.getTime())) {
        errors.push('Invalid due date format. Please provide a valid ISO date.');
      } else {
        cleanData.due_date = parsedDate.toISOString();
      }
    }
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      errors.push('Tags must be an array of strings.');
    } else {
      cleanData.tags = payload.tags
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 30));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: cleanData,
  };
};

/**
 * Validates category payload
 */
const validateCategoryPayload = (payload) => {
  const errors = [];
  const cleanData = {};

  if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
    errors.push('Category name is required.');
  } else if (payload.name.trim().length > 50) {
    errors.push('Category name cannot exceed 50 characters.');
  } else {
    cleanData.name = payload.name.trim();
  }

  if (payload.color) {
    const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (!hexColorRegex.test(payload.color)) {
      errors.push('Category color must be a valid hex color code (e.g. #6366F1).');
    } else {
      cleanData.color = payload.color;
    }
  } else {
    cleanData.color = '#6366F1';
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: cleanData,
  };
};

module.exports = {
  validateTaskPayload,
  validateCategoryPayload,
  VALID_STATUSES,
  VALID_PRIORITIES,
};
