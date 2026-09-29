// frontend/js/main.js
import { auth } from './auth.js';
import { api } from './api.js';

// --- Toast System ---
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <span style="font-weight: 700; font-size: 1.1rem;">${icon}</span>
    <span style="flex: 1;">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Relative Time Helper ---
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- Escape HTML for security ---
export function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Confirmation Modal Helper ---
export function confirmAction(title, message, confirmBtnText = 'Confirm') {
  return new Promise((resolve) => {
    let overlay = document.getElementById('confirmation-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirmation-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
            <button class="btn-icon" id="confirm-modal-close">✕</button>
          </div>
          <p id="confirm-modal-msg" style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
            <button class="btn btn-danger" id="confirm-modal-submit">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-msg');
    const submitBtn = document.getElementById('confirm-modal-submit');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const closeBtn = document.getElementById('confirm-modal-close');

    titleEl.textContent = title;
    msgEl.textContent = message;
    submitBtn.textContent = confirmBtnText;

    const cleanup = () => {
      overlay.classList.remove('open');
      submitBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
    };

    submitBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    closeBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    overlay.classList.add('open');
  });
}

// --- Theme Management (Dark / Light) ---
export function initTheme() {
  const savedTheme = localStorage.getItem('connectly_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    updateThemeIcon(themeBtn, savedTheme);
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('connectly_theme', nextTheme);
      updateThemeIcon(themeBtn, nextTheme);
    });
  }
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// --- Global Navigation Initialization ---
export function initNavigation() {
  const user = auth.getUser();
  const navActions = document.getElementById('navbar-actions');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (navActions) {
    if (auth.isAuthenticated() && user) {
      navActions.innerHTML = `
        <button id="theme-toggle-btn" class="btn-icon" title="Toggle Theme"></button>
        <a href="/index.html" class="nav-link desktop-nav-link" id="nav-home">Feed</a>
        <a href="/create-post.html" class="btn btn-primary btn-sm desktop-nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Post
        </a>
        <a href="/profile.html?id=${user._id}" class="nav-user-badge" title="My Profile">
          <img src="${user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}" class="avatar avatar-sm" alt="${escapeHTML(user.name)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}'" />
          <span style="font-weight: 600; font-size: 0.85rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(user.name)}</span>
        </a>
        <button id="logout-btn" class="btn btn-secondary btn-sm" title="Log out">Logout</button>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          auth.logout();
        });
      }
    } else {
      navActions.innerHTML = `
        <button id="theme-toggle-btn" class="btn-icon" title="Toggle Theme"></button>
        <a href="/login.html" class="btn btn-secondary btn-sm">Log In</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
  }

  // Update mobile bottom nav
  if (mobileNav && auth.isAuthenticated() && user) {
    mobileNav.innerHTML = `
      <a href="/index.html" class="mobile-nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Feed</span>
      </a>
      <a href="/create-post.html" class="mobile-nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
        <span>Post</span>
      </a>
      <a href="/profile.html?id=${user._id}" class="mobile-nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </a>
    `;
  }

  initTheme();
  initSearch();
}

// --- Search Bar Component with Debounced Dropdown ---
export function initSearch() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!searchInput || !dropdown) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

    clearTimeout(debounceTimer);
    if (!query) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await api.users.search(query);
        if (res.success && res.data) {
          renderSearchResults(res.data, dropdown);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 280);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      searchInput.focus();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function renderSearchResults(users, container) {
  if (users.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
        No users found matching this query
      </div>
    `;
    container.style.display = 'block';
    return;
  }

  container.innerHTML = users.map(u => `
    <div class="search-item">
      <div class="search-user-info">
        <img src="${u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}" class="avatar avatar-sm" alt="${escapeHTML(u.name)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}'" />
        <div>
          <a href="/profile.html?id=${u._id}" style="font-weight: 600; font-size: 0.88rem; display: block;">${escapeHTML(u.name)}</a>
          <span style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHTML(u.username)} • ${u.followersCount} followers</span>
        </div>
      </div>
      <a href="/profile.html?id=${u._id}" class="btn btn-secondary btn-sm">View</a>
    </div>
  `).join('');

  container.style.display = 'block';
}

// Run basic initializations upon DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
