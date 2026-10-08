/**
 * TaskFlow Utility Functions
 */

// Theme Management
const THEME_KEY = 'taskflow_theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
  updateThemeIcon(nextTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  if (theme === 'dark') {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// HTML Escaping to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Date Formatting
function formatDate(dateStr) {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return { text: 'No due date', isOverdue: false, isToday: false };
  const d = new Date(dateStr);
  const now = new Date();
  
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((dDate - nowDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'Due Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { text: 'Due Tomorrow', isOverdue: false, isToday: false };
  if (diffDays === -1) return { text: 'Overdue (Yesterday)', isOverdue: true, isToday: false };
  if (diffDays < -1) return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true, isToday: false };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, isOverdue: false, isToday: false };

  return { text: formatDate(dateStr), isOverdue: false, isToday: false };
}

// Debounce helper
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Modal management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global Confirmation Dialog
function showConfirmDialog({ title, message, confirmText = 'Delete', onConfirm }) {
  let modal = document.getElementById('globalConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'globalConfirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-header">
          <h3 id="confirmTitle">Confirm Action</h3>
          <button type="button" class="modal-close-btn" onclick="closeModal('globalConfirmModal')">&times;</button>
        </div>
        <div class="modal-body">
          <p id="confirmMessage" style="font-size: 0.925rem; color: var(--text-muted);"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal('globalConfirmModal')">Cancel</button>
          <button type="button" id="confirmActionBtn" class="btn btn-danger btn-sm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('confirmTitle').innerText = title;
  document.getElementById('confirmMessage').innerText = message;
  const actionBtn = document.getElementById('confirmActionBtn');
  actionBtn.innerText = confirmText;

  // Replace onclick listener
  actionBtn.onclick = async () => {
    closeModal('globalConfirmModal');
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };

  openModal('globalConfirmModal');
}

// Mobile sidebar toggle setup
function setupMobileSidebar() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.app-sidebar');
  let overlay = document.querySelector('.sidebar-overlay');

  if (!overlay && sidebar) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupMobileSidebar();

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
});
