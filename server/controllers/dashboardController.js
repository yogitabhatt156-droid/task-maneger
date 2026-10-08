/**
 * GET /api/dashboard
 * Aggregates statistics, metric counts, and task summaries
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(new Date(todayStart).getTime() + 86400000).toISOString();

    if (req.isDemo) {
      // In demo mode, fetch from the in-memory array in taskController / mocked
      const taskController = require('./taskController');
      // Or synthesize demo metrics directly matching the demo tasks
      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            total: 4,
            pending: 2,
            in_progress: 1,
            completed: 1,
            cancelled: 0,
            overdue: 1,
            due_today: 1,
            completion_rate: 25,
          },
          priorities: {
            Urgent: 1,
            High: 1,
            Medium: 1,
            Low: 1,
          },
          todays_tasks: [
            {
              id: 'task-3',
              title: 'Renew Annual Cloud Server Subscription',
              priority: 'Urgent',
              status: 'Todo',
              due_date: new Date().toISOString(),
              category: { name: 'Finance', color: '#10B981' },
            },
          ],
          upcoming_tasks: [
            {
              id: 'task-1',
              title: 'Complete System Architecture Review',
              priority: 'High',
              status: 'In Progress',
              due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
              category: { name: 'Work', color: '#4F46E5' },
            },
            {
              id: 'task-4',
              title: 'Complete PostgreSQL RLS Mastery Module',
              priority: 'Low',
              status: 'Todo',
              due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
              category: { name: 'Study', color: '#8B5CF6' },
            },
          ],
          recent_tasks: [
            {
              id: 'task-1',
              title: 'Complete System Architecture Review',
              priority: 'High',
              status: 'In Progress',
              created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
              id: 'task-3',
              title: 'Renew Annual Cloud Server Subscription',
              priority: 'Urgent',
              status: 'Todo',
              created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
            },
          ],
        },
        message: 'Dashboard statistics retrieved successfully (demo mode)',
      });
    }

    // 1. Fetch all user's tasks to calculate accurate breakdowns
    const { data: allTasks, error: tasksError } = await req.supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at, category:categories(id, name, color)');

    if (tasksError) {
      return res.status(400).json({
        success: false,
        message: tasksError.message,
      });
    }

    const tasks = allTasks || [];

    const total = tasks.length;
    let pending = 0;
    let in_progress = 0;
    let completed = 0;
    let cancelled = 0;
    let overdue = 0;
    let due_today = 0;

    const priorities = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    const todaysTasksList = [];
    const upcomingTasksList = [];

    const todayStartTime = new Date(todayStart).getTime();
    const todayEndTime = new Date(todayEnd).getTime();

    tasks.forEach((task) => {
      // Status counting
      if (task.status === 'Todo') pending++;
      else if (task.status === 'In Progress') in_progress++;
      else if (task.status === 'Completed') completed++;
      else if (task.status === 'Cancelled') cancelled++;

      // Priorities
      if (priorities[task.priority] !== undefined) {
        priorities[task.priority]++;
      }

      // Dates
      if (task.due_date) {
        const dueTime = new Date(task.due_date).getTime();

        if (dueTime < todayStartTime && task.status !== 'Completed' && task.status !== 'Cancelled') {
          overdue++;
        } else if (dueTime >= todayStartTime && dueTime < todayEndTime) {
          due_today++;
          todaysTasksList.push(task);
        } else if (dueTime >= todayEndTime && task.status !== 'Completed') {
          upcomingTasksList.push(task);
        }
      }
    });

    // Sort upcoming tasks by earliest due date
    upcomingTasksList.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // Recent tasks (last 5 created)
    const recentTasksList = [...tasks]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          total,
          pending,
          in_progress,
          completed,
          cancelled,
          overdue,
          due_today,
          completion_rate,
        },
        priorities,
        todays_tasks: todaysTasksList.slice(0, 10),
        upcoming_tasks: upcomingTasksList.slice(0, 10),
        recent_tasks: recentTasksList,
      },
      message: 'Dashboard statistics retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
};
