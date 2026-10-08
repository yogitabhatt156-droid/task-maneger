const { validateCategoryPayload } = require('../utils/validation');

// Fallback in-memory store for demo mode if Supabase isn't connected yet
let demoCategories = [
  { id: 'cat-1', user_id: '00000000-0000-0000-0000-000000000001', name: 'Work', color: '#4F46E5', created_at: new Date().toISOString() },
  { id: 'cat-2', user_id: '00000000-0000-0000-0000-000000000001', name: 'Personal', color: '#06B6D4', created_at: new Date().toISOString() },
  { id: 'cat-3', user_id: '00000000-0000-0000-0000-000000000001', name: 'Study', color: '#8B5CF6', created_at: new Date().toISOString() },
  { id: 'cat-4', user_id: '00000000-0000-0000-0000-000000000001', name: 'Finance', color: '#10B981', created_at: new Date().toISOString() },
  { id: 'cat-5', user_id: '00000000-0000-0000-0000-000000000001', name: 'Health', color: '#F59E0B', created_at: new Date().toISOString() },
];

/**
 * Get all categories for current user
 */
const getCategories = async (req, res, next) => {
  try {
    if (req.isDemo) {
      return res.status(200).json({
        success: true,
        data: demoCategories,
        message: 'Categories fetched successfully (demo mode)',
      });
    }

    const { data, error } = await req.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      message: 'Categories fetched successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new category
 */
const createCategory = async (req, res, next) => {
  try {
    const validation = validateCategoryPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        errors: validation.errors,
      });
    }

    if (req.isDemo) {
      const newCat = {
        id: `cat-${Date.now()}`,
        user_id: req.user.id,
        name: validation.data.name,
        color: validation.data.color,
        created_at: new Date().toISOString(),
      };
      demoCategories.push(newCat);
      return res.status(201).json({
        success: true,
        data: newCat,
        message: 'Category created successfully',
      });
    }

    const { data, error } = await req.supabase
      .from('categories')
      .insert({
        user_id: req.user.id,
        name: validation.data.name,
        color: validation.data.color,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Category created successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = validateCategoryPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
      });
    }

    if (req.isDemo) {
      const index = demoCategories.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      demoCategories[index] = {
        ...demoCategories[index],
        name: validation.data.name,
        color: validation.data.color,
      };
      return res.status(200).json({
        success: true,
        data: demoCategories[index],
        message: 'Category updated successfully',
      });
    }

    const { data, error } = await req.supabase
      .from('categories')
      .update({
        name: validation.data.name,
        color: validation.data.color,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Category updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a category
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      demoCategories = demoCategories.filter((c) => c.id !== id);
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    }

    const { error } = await req.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
