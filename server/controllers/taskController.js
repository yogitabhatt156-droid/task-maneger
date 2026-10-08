const { validateTaskPayload } = require('../utils/validation');

// Demo data for preview mode
let demoTasks = [
  {
    id: 'task-1',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Complete System Architecture Review',
    description: 'Audit Express API endpoints, middleware, and database indexing schemas.',
    status: 'In Progress',
    priority: 'High',
    category_id: 'cat-1',
    category: { id: 'cat-1', name: 'Work', color: '#4F46E5' },
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['Architecture', 'API', 'Security'],
  },
  {
    id: 'task-2',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Design Dark Mode Design System',
    description: 'Ensure contrast ratios and accessible color tokens for dark mode in CSS.',
    status: 'Completed',
    priority: 'Medium',
    category_id: 'cat-1',
    category: { id: 'cat-1', name: 'Work', color: '#4F46E5' },
    due_date: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['UI/UX', 'CSS'],
  },
  {
    id: 'task-3',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Renew Annual Cloud Server Subscription',
    description: 'Review invoice from hosting provider and update payment method.',
    status: 'Todo',
    priority: 'Urgent',
    category_id: 'cat-4',
    category: { id: 'cat-4', name: 'Finance', color: '#10B981' },
    due_date: new Date().toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['Billing', 'Cloud'],
  },
  {
    id: 'task-4',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Complete PostgreSQL RLS Mastery Module',
    description: 'Study fine-grained row-level security policies and role-based access control.',
    status: 'Todo',
    priority: 'Low',
    category_id: 'cat-3',
    category: { id: 'cat-3', name: 'Study', color: '#8B5CF6' },
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['Database', 'Postgres'],
  },
];

/**
 * Priority rank helper for sorting
 */
const PRIORITY_ORDER = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * GET /api/tasks
 * Filter, search, and sort tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      category_id,
      due_date_filter,
      sort_by = 'newest',
    } = req.query;

    if (req.isDemo) {
      let filtered = [...demoTasks];

      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
        );
      }

      if (status && status !== 'all') {
        filtered = filtered.filter((t) => t.status === status);
      }

      if (priority && priority !== 'all') {
        filtered = filtered.filter((t) => t.priority === priority);
      }

      if (category_id && category_id !== 'all') {
        filtered = filtered.filter((t) => t.category_id === category_id);
      }

      if (due_date_filter) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 86400000);

        if (due_date_filter === 'today') {
          filtered = filtered.filter(
            (t) => t.due_date && new Date(t.due_date) >= todayStart && new Date(t.due_date) < todayEnd
          );
        } else if (due_date_filter === 'overdue') {
          filtered = filtered.filter(
            (t) => t.due_date && new Date(t.due_date) < todayStart && t.status !== 'Completed'
          );
        } else if (due_date_filter === 'upcoming') {
          filtered = filtered.filter(
            (t) => t.due_date && new Date(t.due_date) >= todayEnd
          );
        }
      }

      // Sorting
      filtered.sort((a, b) => {
        if (sort_by === 'oldest') {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        if (sort_by === 'due_date') {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (sort_by === 'priority') {
          return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        }
        if (sort_by === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        // default: newest
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return res.status(200).json({
        success: true,
        data: filtered,
        count: filtered.length,
        message: 'Tasks retrieved successfully (demo mode)',
      });
    }

    // Supabase query
    let query = req.supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        task_tags(
          tag:tags(*)
        )
      `);

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Category filter
    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }

    // Text search (title / description)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Due date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(new Date(todayStart).getTime() + 86400000).toISOString();

    if (due_date_filter === 'today') {
      query = query.gte('due_date', todayStart).lt('due_date', todayEnd);
    } else if (due_date_filter === 'overdue') {
      query = query.lt('due_date', todayStart).neq('status', 'Completed');
    } else if (due_date_filter === 'upcoming') {
      query = query.gte('due_date', todayEnd);
    }

    // Sorting
    switch (sort_by) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'due_date':
        query = query.order('due_date', { ascending: true, nullsFirst: false });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      case 'priority':
        // Supabase Postgres order by column directly or secondary
        query = query.order('priority', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Format tasks to flatten task_tags into a clean tags array
    const formattedTasks = (data || []).map((t) => {
      const tags = (t.task_tags || [])
        .map((tt) => tt.tag?.name)
        .filter(Boolean);
      return {
        ...t,
        tags,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedTasks,
      count: formattedTasks.length,
      message: 'Tasks retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 * Retrieve a specific task by ID
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      const task = demoTasks.find((t) => t.id === id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.status(200).json({ success: true, data: task });
    }

    const { data, error } = await req.supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*),
        task_tags(
          tag:tags(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    const tags = (data.task_tags || []).map((tt) => tt.tag?.name).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        tags,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    const validation = validateTaskPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        errors: validation.errors,
      });
    }

    const { title, description, status, priority, category_id, due_date, tags = [] } = validation.data;
    const completed_at = status === 'Completed' ? new Date().toISOString() : null;

    if (req.isDemo) {
      const newTask = {
        id: `task-${Date.now()}`,
        user_id: req.user.id,
        title,
        description: description || null,
        status,
        priority,
        category_id: category_id || null,
        category: null,
        due_date: due_date || null,
        completed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags,
      };
      demoTasks.unshift(newTask);
      return res.status(201).json({
        success: true,
        data: newTask,
        message: 'Task created successfully',
      });
    }

    // 1. Insert task into tasks table
    const { data: createdTask, error: taskError } = await req.supabase
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        status,
        priority,
        category_id,
        due_date,
        completed_at,
      })
      .select('*, category:categories(*)')
      .single();

    if (taskError) {
      return res.status(400).json({
        success: false,
        message: taskError.message,
      });
    }

    // 2. Process and associate tags if any
    const associatedTagNames = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Upsert/Find Tag
        const { data: tagData, error: tagSelectError } = await req.supabase
          .from('tags')
          .select('id, name')
          .eq('name', tagName)
          .maybeSingle();

        let tagId = tagData?.id;

        if (!tagId) {
          const { data: newTag, error: tagInsertError } = await req.supabase
            .from('tags')
            .insert({ user_id: req.user.id, name: tagName })
            .select('id, name')
            .single();

          if (!tagInsertError && newTag) {
            tagId = newTag.id;
          }
        }

        if (tagId) {
          await req.supabase
            .from('task_tags')
            .insert({ task_id: createdTask.id, tag_id: tagId });
          associatedTagNames.push(tagName);
        }
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        ...createdTask,
        tags: associatedTagNames,
      },
      message: 'Task created successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = validateTaskPayload(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        errors: validation.errors,
      });
    }

    const updateFields = { ...validation.data };

    if (updateFields.status) {
      if (updateFields.status === 'Completed') {
        updateFields.completed_at = new Date().toISOString();
      } else {
        updateFields.completed_at = null;
      }
    }

    const { tags, ...dbFields } = updateFields;

    if (req.isDemo) {
      const index = demoTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      demoTasks[index] = {
        ...demoTasks[index],
        ...dbFields,
        ...(tags !== undefined ? { tags } : {}),
        updated_at: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        data: demoTasks[index],
        message: 'Task updated successfully',
      });
    }

    // 1. Update task in database
    const { data: updatedTask, error: updateError } = await req.supabase
      .from('tasks')
      .update(dbFields)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message,
      });
    }

    // 2. Update tags if tags array was provided in request
    if (tags !== undefined) {
      // Clear current associations
      await req.supabase.from('task_tags').delete().eq('task_id', id);

      // Re-link new tags
      for (const tagName of tags) {
        const { data: tagData } = await req.supabase
          .from('tags')
          .select('id, name')
          .eq('name', tagName)
          .maybeSingle();

        let tagId = tagData?.id;

        if (!tagId) {
          const { data: newTag } = await req.supabase
            .from('tags')
            .insert({ user_id: req.user.id, name: tagName })
            .select('id, name')
            .single();

          if (newTag) tagId = newTag.id;
        }

        if (tagId) {
          await req.supabase.from('task_tags').insert({ task_id: id, tag_id: tagId });
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...updatedTask,
        tags: tags !== undefined ? tags : [],
      },
      message: 'Task updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tasks/:id
 * Remove a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.isDemo) {
      demoTasks = demoTasks.filter((t) => t.id !== id);
      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    }

    const { error } = await req.supabase
      .from('tasks')
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
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
