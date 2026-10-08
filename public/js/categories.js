/**
 * TaskFlow Categories Management Logic
 */

let categoriesList = [];
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await requireAuth();
  if (!isAuthed) return;

  await loadCategories();
  setupCategoryModal();
  setupColorPresets();
});

async function loadCategories() {
  const container = document.getElementById('categoriesGrid');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
        <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
      </div>
    `;
  }

  try {
    const res = await api.categories.getAll();
    if (res.success) {
      categoriesList = res.data;
      renderCategories(categoriesList);
    }
  } catch (err) {
    showToast(err.message || 'Failed to load categories', 'error');
  }
}

function renderCategories(categories) {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🏷️</div>
        <h4>No categories yet</h4>
        <p>Categories help you group tasks by domain like Work, Health, Personal, or Finance.</p>
        <button class="btn btn-primary btn-sm" onclick="openCreateCategoryModal()">+ Create Category</button>
      </div>
    `;
    return;
  }

  container.innerHTML = categories
    .map(
      (cat) => `
      <div class="card-panel" style="display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; border-top: 4px solid ${escapeHtml(cat.color || '#4f46e5')}">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${escapeHtml(cat.color || '#4f46e5')}"></div>
            <h4 style="font-size: 1.05rem; font-weight: 700;">${escapeHtml(cat.name)}</h4>
          </div>
          <span class="badge" style="background-color: var(--bg-surface-alt); color: var(--text-muted); font-size: 0.75rem;">
            Category
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          <a href="/tasks.html?category=${cat.id}" class="btn btn-ghost btn-sm" style="font-size: 0.75rem; color: var(--primary);">
            View Tasks &rarr;
          </a>
          <div style="display: flex; gap: 0.25rem;">
            <button class="btn btn-ghost btn-sm btn-icon" title="Edit Category" onclick="openEditCategoryModal('${cat.id}')">
              ✏️
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" title="Delete Category" onclick="confirmDeleteCategory('${cat.id}', '${escapeHtml(cat.name)}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join('');
}

function setupColorPresets() {
  const buttons = document.querySelectorAll('.color-preset-btn');
  const colorInput = document.getElementById('categoryColor');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      if (color && colorInput) {
        colorInput.value = color;
      }
    });
  });
}

function setupCategoryModal() {
  const form = document.getElementById('categoryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('categoryName').value.trim();
    const color = document.getElementById('categoryColor').value;

    if (!name) {
      showToast('⚠ Please provide a category name', 'warning');
      return;
    }

    try {
      if (editingCategoryId) {
        await api.categories.update(editingCategoryId, { name, color });
        showToast('✓ Category updated successfully', 'success');
      } else {
        await api.categories.create({ name, color });
        showToast('✓ Category created successfully', 'success');
      }
      closeModal('categoryModal');
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Unable to save category', 'error');
    }
  });
}

function openCreateCategoryModal() {
  editingCategoryId = null;
  document.getElementById('categoryModalTitle').innerText = 'Create Category';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryColor').value = '#4f46e5';
  openModal('categoryModal');
}

function openEditCategoryModal(id) {
  const cat = categoriesList.find((c) => c.id === id);
  if (!cat) return;

  editingCategoryId = id;
  document.getElementById('categoryModalTitle').innerText = 'Edit Category';
  document.getElementById('categoryName').value = cat.name;
  document.getElementById('categoryColor').value = cat.color || '#4f46e5';
  openModal('categoryModal');
}

function confirmDeleteCategory(id, name) {
  showConfirmDialog({
    title: 'Delete Category',
    message: `Are you sure you want to delete category "${name}"? Tasks assigned to this category will not be deleted, but will become uncategorized.`,
    confirmText: 'Delete Category',
    onConfirm: async () => {
      try {
        await api.categories.delete(id);
        showToast('✓ Category deleted successfully', 'success');
        await loadCategories();
      } catch (err) {
        showToast(err.message || 'Failed to delete category', 'error');
      }
    },
  });
}
