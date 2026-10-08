/**
 * TaskFlow Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await requireAuth();
  if (!isAuthed) return;

  await loadDashboardData();
  setupQuickTaskModal();
});

async function loadDashboardData() {
  try {
    const res = await api.dashboard.getStats();
    if (res.success && res.data) {
      renderMetrics(res.data.metrics);
      renderProgressVisuals(res.data.metrics, res.data.priorities);
      renderTodaysTasks(res.data.todays_tasks || []);
      renderUpcomingTasks(res.data.upcoming_tasks || []);
    }
  } catch (err) {
    showToast(err.message || 'Failed to load dashboard metrics', 'error');
  }
}

function renderMetrics(metrics) {
  if (!metrics) return;
  document.getElementById('statTotal').innerText = metrics.total;
  document.getElementById('statPending').innerText = metrics.pending;
  document.getElementById('statInProgress').innerText = metrics.in_progress;
  document.getElementById('statCompleted').innerText = metrics.completed;
  document.getElementById('statOverdue').innerText = metrics.overdue;
  document.getElementById('statDueToday').innerText = metrics.due_today;
}

function renderProgressVisuals(metrics, priorities = {}) {
  const completionRate = metrics.completion_rate || 0;
  const rateEl = document.getElementById('completionRateText');
  const barEl = document.getElementById('completionProgressBar');

  if (rateEl) rateEl.innerText = `${completionRate}%`;
  if (barEl) barEl.style.width = `${completionRate}%`;

  // Priority Breakdown Bar
  const totalWithPrio = (priorities.Low || 0) + (priorities.Medium || 0) + (priorities.High || 0) + (priorities.Urgent || 0);

  const getPercent = (count) => (totalWithPrio > 0 ? Math.round((count / totalWithPrio) * 100) : 0);

  ['Urgent', 'High', 'Medium', 'Low'].forEach((prio) => {
    const count = priorities[prio] || 0;
    const fillEl = document.getElementById(`prioBar_${prio}`);
    const countEl = document.getElementById(`prioCount_${prio}`);
    if (fillEl) fillEl.style.width = `${getPercent(count)}%`;
    if (countEl) countEl.innerText = count;
  });
}

function renderTodaysTasks(tasks) {
  const container = document.getElementById('todaysTasksList');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <div class="empty-state-icon">🎉</div>
        <h4>No tasks due today</h4>
        <p>You're completely clear for today or haven't scheduled any tasks for today yet.</p>
        <button class="btn btn-primary btn-sm" onclick="openNewTaskModal()">+ Add Task</button>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="task-list-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  tasks.forEach((t) => {
    html += `
      <tr>
        <td>
          <a href="/tasks.html?id=${t.id}" style="font-weight: 600; color: var(--text-main);">
            ${escapeHtml(t.title)}
          </a>
        </td>
        <td>
          ${
            t.category
              ? `<span class="badge badge-category" style="border-left: 3px solid ${t.category.color || '#4f46e5'}">${escapeHtml(t.category.name)}</span>`
              : '<span class="text-subtle" style="font-size:0.75rem;">None</span>'
          }
        </td>
        <td>
          <span class="badge badge-prio-${t.priority.toLowerCase()}">${t.priority}</span>
        </td>
        <td>
          <span class="badge badge-status-${t.status.toLowerCase().replace(' ', '')}">
            <span class="badge-dot"></span>
            ${t.status}
          </span>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function renderUpcomingTasks(tasks) {
  const container = document.getElementById('upcomingTasksList');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <div class="empty-state-icon">📅</div>
        <h4>No upcoming deadlines</h4>
        <p>You have no pending deadlines scheduled for the coming week.</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="task-list-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  tasks.forEach((t) => {
    const rel = formatRelativeDate(t.due_date);
    html += `
      <tr>
        <td>
          <a href="/tasks.html?id=${t.id}" style="font-weight: 600; color: var(--text-main);">
            ${escapeHtml(t.title)}
          </a>
        </td>
        <td>
          <span class="task-due-info ${rel.isOverdue ? 'overdue' : ''}">
            ${escapeHtml(rel.text)}
          </span>
        </td>
        <td>
          <span class="badge badge-prio-${t.priority.toLowerCase()}">${t.priority}</span>
        </td>
        <td>
          <span class="badge badge-status-${t.status.toLowerCase().replace(' ', '')}">
            <span class="badge-dot"></span>
            ${t.status}
          </span>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Quick Task Modal
async function setupQuickTaskModal() {
  const form = document.getElementById('quickTaskForm');
  if (!form) return;

  // Load categories into select
  try {
    const catRes = await api.categories.getAll();
    const catSelect = document.getElementById('taskCategorySelect');
    if (catSelect && catRes.success) {
      catSelect.innerHTML = '<option value="">No Category</option>' +
        catRes.data.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }
  } catch (e) {}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitleInput').value.trim();
    if (!title) {
      showToast('Please enter a task title', 'warning');
      return;
    }

    const payload = {
      title,
      description: document.getElementById('taskDescInput').value.trim(),
      priority: document.getElementById('taskPrioritySelect').value,
      status: document.getElementById('taskStatusSelect').value,
      category_id: document.getElementById('taskCategorySelect').value || null,
      due_date: document.getElementById('taskDueDateInput').value || null,
      tags: document.getElementById('taskTagsInput').value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await api.tasks.create(payload);
      if (res.success) {
        showToast('✓ Task created successfully', 'success');
        closeModal('taskModal');
        form.reset();
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create task', 'error');
    }
  });
}

function openNewTaskModal() {
  const form = document.getElementById('quickTaskForm');
  if (form) form.reset();
  const title = document.getElementById('modalTitle');
  if (title) title.innerText = 'Create New Task';
  openModal('taskModal');
}
