/**
 * TaskFlow Tasks Management Controller
 */

let allTasks = [];
let allCategories = [];
let currentTags = [];
let editingTaskId = null;
let currentView = 'grid'; // 'grid' | 'table'

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await requireAuth();
  if (!isAuthed) return;

  await initCategories();
  await loadTasks();
  setupFilterListeners();
  setupTaskModal();
  setupTagsInput();

  // If redirected with ?id=xyz, open task details
  const params = new URLSearchParams(window.location.search);
  const taskIdParam = params.get('id');
  if (taskIdParam) {
    setTimeout(() => openTaskDetailsModal(taskIdParam), 300);
  }
});

async function initCategories() {
  try {
    const res = await api.categories.getAll();
    if (res.success) {
      allCategories = res.data;
      const select = document.getElementById('filterCategory');
      const modalSelect = document.getElementById('taskCategory');

      let options = '<option value="all">All Categories</option>';
      let modalOptions = '<option value="">Select Category</option>';

      allCategories.forEach((cat) => {
        options += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
        modalOptions += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
      });

      if (select) select.innerHTML = options;
      if (modalSelect) modalSelect.innerHTML = modalOptions;
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function loadTasks() {
  const container = document.getElementById('tasksContainer');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
        <div class="skeleton" style="height: 140px; margin-bottom: 1rem;"></div>
        <div class="skeleton" style="height: 140px;"></div>
      </div>
    `;
  }

  const filters = {
    search: document.getElementById('searchTasks')?.value.trim() || '',
    status: document.getElementById('filterStatus')?.value || 'all',
    priority: document.getElementById('filterPriority')?.value || 'all',
    category_id: document.getElementById('filterCategory')?.value || 'all',
    due_date_filter: document.getElementById('filterDueDate')?.value || '',
    sort_by: document.getElementById('sortBy')?.value || 'newest',
  };

  try {
    const res = await api.tasks.getAll(filters);
    if (res.success) {
      allTasks = res.data;
      renderTasks(allTasks);
      updateTaskCount(res.count);
    }
  } catch (err) {
    showToast(err.message || 'Unable to retrieve tasks', 'error');
  }
}

function updateTaskCount(count) {
  const el = document.getElementById('taskCountBadge');
  if (el) el.innerText = `${count} ${count === 1 ? 'task' : 'tasks'}`;
}

function renderTasks(tasks) {
  const container = document.getElementById('tasksContainer');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📋</div>
        <h4>No tasks found</h4>
        <p>No tasks matched your current search filters, or you haven't created any yet.</p>
        <button class="btn btn-primary btn-sm" onclick="openCreateTaskModal()">+ Create New Task</button>
      </div>
    `;
    return;
  }

  if (currentView === 'table') {
    renderTableView(container, tasks);
  } else {
    renderGridView(container, tasks);
  }
}

function renderGridView(container, tasks) {
  container.className = 'tasks-grid-view';
  container.innerHTML = tasks
    .map((task) => {
      const isCompleted = task.status === 'Completed';
      const relDue = formatRelativeDate(task.due_date);

      return `
        <div class="task-card-item ${isCompleted ? 'completed' : ''}" id="card-${task.id}">
          <div>
            <div class="task-card-header">
              <div class="task-card-title-group">
                <input
                  type="checkbox"
                  class="task-checkbox"
                  ${isCompleted ? 'checked' : ''}
                  title="Toggle Complete"
                  onchange="toggleTaskComplete('${task.id}', this.checked)"
                />
                <div>
                  <h4 class="task-title" onclick="openTaskDetailsModal('${task.id}')">
                    ${escapeHtml(task.title)}
                  </h4>
                  ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
                </div>
              </div>
              <span class="badge badge-prio-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>

            <div class="task-tags-row">
              <span class="badge badge-status-${task.status.toLowerCase().replace(' ', '')}">
                <span class="badge-dot"></span>
                ${task.status}
              </span>
              ${
                task.category
                  ? `<span class="badge badge-category" style="border-left: 3px solid ${task.category.color || '#4f46e5'}">${escapeHtml(task.category.name)}</span>`
                  : ''
              }
              ${(task.tags || [])
                .map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`)
                .join('')}
            </div>
          </div>

          <div class="task-card-footer">
            <span class="task-due-info ${relDue.isOverdue ? 'overdue' : ''}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ${escapeHtml(relDue.text)}
            </span>

            <div class="task-actions-dropdown">
              <button class="btn btn-ghost btn-icon btn-sm" title="View Details" onclick="openTaskDetailsModal('${task.id}')">
                👁️
              </button>
              <button class="btn btn-ghost btn-icon btn-sm" title="Edit Task" onclick="openEditTaskModal('${task.id}')">
                ✏️
              </button>
              <button class="btn btn-ghost btn-icon btn-sm" title="Delete Task" onclick="confirmDeleteTask('${task.id}', '${escapeHtml(task.title)}')">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderTableView(container, tasks) {
  container.className = 'card-panel';
  container.innerHTML = `
    <div class="table-responsive">
      <table class="task-list-table">
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th>Task Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map((task) => {
              const isCompleted = task.status === 'Completed';
              const rel = formatRelativeDate(task.due_date);
              return `
              <tr class="${isCompleted ? 'completed' : ''}">
                <td>
                  <input
                    type="checkbox"
                    class="task-checkbox"
                    ${isCompleted ? 'checked' : ''}
                    onchange="toggleTaskComplete('${task.id}', this.checked)"
                  />
                </td>
                <td>
                  <div style="font-weight: 600; cursor: pointer;" onclick="openTaskDetailsModal('${task.id}')">
                    ${escapeHtml(task.title)}
                  </div>
                  ${(task.tags || []).length > 0 ? `
                    <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem;">
                      ${task.tags.map(t => `<span class="tag-chip" style="font-size:0.65rem;">#${escapeHtml(t)}</span>`).join('')}
                    </div>
                  ` : ''}
                </td>
                <td>
                  ${task.category ? `<span class="badge badge-category" style="border-left: 3px solid ${task.category.color || '#4f46e5'}">${escapeHtml(task.category.name)}</span>` : '<span class="text-subtle">None</span>'}
                </td>
                <td><span class="badge badge-prio-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td>
                  <span class="badge badge-status-${task.status.toLowerCase().replace(' ', '')}">
                    <span class="badge-dot"></span>
                    ${task.status}
                  </span>
                </td>
                <td>
                  <span class="task-due-info ${rel.isOverdue ? 'overdue' : ''}">${escapeHtml(rel.text)}</span>
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-ghost btn-sm" onclick="openEditTaskModal('${task.id}')">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color: #ef4444;" onclick="confirmDeleteTask('${task.id}', '${escapeHtml(task.title)}')">Delete</button>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function setView(viewType) {
  currentView = viewType;
  const gridBtn = document.getElementById('viewGridBtn');
  const tableBtn = document.getElementById('viewTableBtn');
  if (gridBtn && tableBtn) {
    if (viewType === 'grid') {
      gridBtn.classList.add('btn-primary');
      gridBtn.classList.remove('btn-secondary');
      tableBtn.classList.add('btn-secondary');
      tableBtn.classList.remove('btn-primary');
    } else {
      tableBtn.classList.add('btn-primary');
      tableBtn.classList.remove('btn-secondary');
      gridBtn.classList.add('btn-secondary');
      gridBtn.classList.remove('btn-primary');
    }
  }
  renderTasks(allTasks);
}

function setupFilterListeners() {
  const searchInput = document.getElementById('searchTasks');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => loadTasks(), 300));
  }

  ['filterStatus', 'filterPriority', 'filterCategory', 'filterDueDate', 'sortBy'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => loadTasks());
  });
}

// Toggle Task Completion Checkbox
async function toggleTaskComplete(taskId, isChecked) {
  const newStatus = isChecked ? 'Completed' : 'Todo';
  try {
    const res = await api.tasks.update(taskId, { status: newStatus });
    if (res.success) {
      showToast(isChecked ? '✓ Task marked completed' : 'Task marked as Todo', 'success');
      await loadTasks();
    }
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
    await loadTasks();
  }
}

// Task Create/Edit Modal Setup
function setupTaskModal() {
  const form = document.getElementById('taskForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    if (!title) {
      showToast('⚠ Please enter a task title', 'warning');
      return;
    }

    const payload = {
      title,
      description: document.getElementById('taskDescription').value.trim(),
      status: document.getElementById('taskStatus').value,
      priority: document.getElementById('taskPriority').value,
      category_id: document.getElementById('taskCategory').value || null,
      due_date: document.getElementById('taskDueDate').value || null,
      tags: currentTags,
    };

    try {
      if (editingTaskId) {
        await api.tasks.update(editingTaskId, payload);
        showToast('✓ Task updated successfully', 'success');
      } else {
        await api.tasks.create(payload);
        showToast('✓ Task created successfully', 'success');
      }
      closeModal('taskEditorModal');
      await loadTasks();
    } catch (err) {
      showToast(err.message || 'Unable to save task', 'error');
    }
  });
}

function setupTagsInput() {
  const input = document.getElementById('taskTagInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/^#/, '');
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        renderTagChips();
      }
      input.value = '';
    }
  });
}

function renderTagChips() {
  const container = document.getElementById('tagsChipsContainer');
  if (!container) return;

  container.innerHTML = currentTags
    .map(
      (tag, index) => `
      <span class="tag-chip">
        #${escapeHtml(tag)}
        <button type="button" class="tag-remove-btn" onclick="removeTagChip(${index})">&times;</button>
      </span>
    `
    )
    .join('');
}

function removeTagChip(index) {
  currentTags.splice(index, 1);
  renderTagChips();
}

function openCreateTaskModal() {
  editingTaskId = null;
  currentTags = [];
  renderTagChips();

  document.getElementById('taskEditorModalTitle').innerText = 'Create New Task';
  document.getElementById('taskForm').reset();
  document.getElementById('taskStatus').value = 'Todo';
  document.getElementById('taskPriority').value = 'Medium';

  openModal('taskEditorModal');
}

async function openEditTaskModal(taskId) {
  try {
    const res = await api.tasks.getById(taskId);
    if (!res.success) return;
    const task = res.data;

    editingTaskId = task.id;
    document.getElementById('taskEditorModalTitle').innerText = 'Edit Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category_id || '';

    if (task.due_date) {
      // Format as YYYY-MM-DD for date input
      const datePart = new Date(task.due_date).toISOString().split('T')[0];
      document.getElementById('taskDueDate').value = datePart;
    } else {
      document.getElementById('taskDueDate').value = '';
    }

    currentTags = Array.isArray(task.tags) ? [...task.tags] : [];
    renderTagChips();

    openModal('taskEditorModal');
  } catch (err) {
    showToast(err.message || 'Unable to open task for editing', 'error');
  }
}

// Task Details Modal
async function openTaskDetailsModal(taskId) {
  try {
    const res = await api.tasks.getById(taskId);
    if (!res.success) return;
    const task = res.data;

    document.getElementById('detailsTitle').innerText = task.title;
    document.getElementById('detailsDescription').innerText = task.description || 'No description provided.';
    document.getElementById('detailsPriority').innerHTML = `<span class="badge badge-prio-${task.priority.toLowerCase()}">${task.priority}</span>`;
    document.getElementById('detailsStatus').innerHTML = `
      <span class="badge badge-status-${task.status.toLowerCase().replace(' ', '')}">
        <span class="badge-dot"></span>
        ${task.status}
      </span>
    `;

    document.getElementById('detailsCategory').innerHTML = task.category
      ? `<span class="badge badge-category" style="border-left: 3px solid ${task.category.color || '#4f46e5'}">${escapeHtml(task.category.name)}</span>`
      : '<span class="text-subtle">None</span>';

    const relDue = formatRelativeDate(task.due_date);
    document.getElementById('detailsDueDate').innerHTML = `
      <span class="${relDue.isOverdue ? 'text-danger' : ''}">${escapeHtml(relDue.text)}</span>
    `;

    document.getElementById('detailsCreatedAt').innerText = formatDate(task.created_at);
    document.getElementById('detailsCompletedAt').innerText = task.completed_at ? formatDate(task.completed_at) : 'Not completed';

    const tagsContainer = document.getElementById('detailsTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = (task.tags || []).length > 0
        ? task.tags.map((t) => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join(' ')
        : '<span class="text-subtle">No tags</span>';
    }

    const editBtn = document.getElementById('detailsEditBtn');
    if (editBtn) {
      editBtn.onclick = () => {
        closeModal('taskDetailsModal');
        openEditTaskModal(task.id);
      };
    }

    openModal('taskDetailsModal');
  } catch (err) {
    showToast(err.message || 'Unable to view task details', 'error');
  }
}

function confirmDeleteTask(taskId, taskTitle) {
  showConfirmDialog({
    title: 'Delete Task',
    message: `Are you sure you want to permanently delete "${taskTitle}"? This action cannot be undone.`,
    confirmText: 'Delete Task',
    onConfirm: async () => {
      try {
        const res = await api.tasks.delete(taskId);
        if (res.success) {
          showToast('✓ Task deleted successfully', 'success');
          await loadTasks();
        }
      } catch (err) {
        showToast(err.message || 'Failed to delete task', 'error');
      }
    },
  });
}
