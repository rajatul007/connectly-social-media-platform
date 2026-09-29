// frontend/js/profile.js
import { api } from './api.js';
import { auth } from './auth.js';
import { posts } from './posts.js';
import { showToast, escapeHTML, formatRelativeTime } from './main.js';

let profileUser = null;
let currentTab = 'posts'; // 'posts', 'followers', 'following'

document.addEventListener('DOMContentLoaded', async () => {
  await initProfilePage();
});

async function initProfilePage() {
  const urlParams = new URLSearchParams(window.location.search);
  let userId = urlParams.get('id');
  const tabParam = urlParams.get('tab');

  if (!userId) {
    const currentUser = auth.getUser();
    if (currentUser) {
      userId = currentUser._id;
    } else {
      window.location.href = '/login.html';
      return;
    }
  }

  if (tabParam && ['posts', 'followers', 'following'].includes(tabParam)) {
    currentTab = tabParam;
  }

  setupTabs();
  setupEditProfileModal();
  await loadUserProfile(userId);
}

async function loadUserProfile(userId) {
  const container = document.getElementById('profile-header-container');
  if (!container) return;

  try {
    const res = await api.users.getProfile(userId);
    if (!res.success || !res.data) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 40px;">
          <h3 class="empty-state-title">User Not Found</h3>
          <p class="empty-state-text">The user profile you are looking for does not exist or has been removed.</p>
          <a href="/index.html" class="btn btn-primary btn-sm">Return Home</a>
        </div>
      `;
      return;
    }

    profileUser = res.data;
    renderProfileHeader(profileUser);
    switchTab(currentTab);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: 40px;">
        <h3 class="empty-state-title" style="color: var(--accent-red);">Error Loading Profile</h3>
        <p class="empty-state-text">${escapeHTML(err.message)}</p>
        <a href="/index.html" class="btn btn-secondary btn-sm">Return Home</a>
      </div>
    `;
    showToast(err.message || 'Failed to load profile', 'error');
  }
}

function renderProfileHeader(user) {
  const container = document.getElementById('profile-header-container');
  if (!container) return;

  const currentUser = auth.getUser();
  const isSelf = currentUser && currentUser._id.toString() === user._id.toString();

  container.innerHTML = `
    <div class="profile-banner-card">
      <div class="profile-cover-image"></div>
      <div class="profile-header-body">
        <div class="profile-avatar-row">
          <img src="${user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}" class="avatar avatar-xl" alt="${escapeHTML(user.name)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}'" />
          <div>
            ${isSelf ? `
              <button id="edit-profile-btn" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Profile
              </button>
            ` : `
              <button id="follow-profile-btn" class="btn ${user.isFollowing ? 'btn-secondary' : 'btn-primary'}" data-id="${user._id}">
                ${user.isFollowing ? 'Following' : 'Follow'}
              </button>
            `}
          </div>
        </div>

        <h1 class="profile-info-name">${escapeHTML(user.name)}</h1>
        <p class="profile-info-username">@${escapeHTML(user.username)}</p>
        <p class="profile-info-bio">${escapeHTML(user.bio || 'No bio provided yet.')}</p>

        <div class="profile-meta-row">
          <div class="profile-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Joined ${formatRelativeTime(user.createdAt)}</span>
          </div>
          <div class="profile-meta-item">
            <strong style="color: var(--text-primary); font-weight: 700;" id="profile-posts-stat">${user.postsCount || 0}</strong> Posts
          </div>
          <div class="profile-meta-item" style="cursor: pointer;" onclick="document.querySelector('[data-tab=followers]').click()">
            <strong style="color: var(--text-primary); font-weight: 700;" id="profile-followers-stat">${user.followersCount || 0}</strong> Followers
          </div>
          <div class="profile-meta-item" style="cursor: pointer;" onclick="document.querySelector('[data-tab=following]').click()">
            <strong style="color: var(--text-primary); font-weight: 700;" id="profile-following-stat">${user.followingCount || 0}</strong> Following
          </div>
        </div>

        <div class="profile-tabs">
          <button class="profile-tab-btn ${currentTab === 'posts' ? 'active' : ''}" data-tab="posts">Posts</button>
          <button class="profile-tab-btn ${currentTab === 'followers' ? 'active' : ''}" data-tab="followers">Followers (<span id="tab-followers-count">${user.followersCount || 0}</span>)</button>
          <button class="profile-tab-btn ${currentTab === 'following' ? 'active' : ''}" data-tab="following">Following (<span id="tab-following-count">${user.followingCount || 0}</span>)</button>
        </div>
      </div>
    </div>
  `;

  // Follow / Unfollow profile button
  const followBtn = document.getElementById('follow-profile-btn');
  if (followBtn) {
    followBtn.onclick = async () => {
      if (!auth.isAuthenticated()) {
        showToast('Please log in to follow users', 'info');
        return;
      }

      followBtn.disabled = true;
      try {
        if (user.isFollowing) {
          await api.users.unfollow(user._id);
          user.isFollowing = false;
          user.followersCount = Math.max(0, (user.followersCount || 0) - 1);
          followBtn.textContent = 'Follow';
          followBtn.className = 'btn btn-primary';
          showToast(`Unfollowed @${user.username}`, 'info');
        } else {
          await api.users.follow(user._id);
          user.isFollowing = true;
          user.followersCount = (user.followersCount || 0) + 1;
          followBtn.textContent = 'Following';
          followBtn.className = 'btn btn-secondary';
          showToast(`Now following @${user.username}`, 'success');
        }

        const followersStat = document.getElementById('profile-followers-stat');
        const tabCount = document.getElementById('tab-followers-count');
        if (followersStat) followersStat.textContent = user.followersCount;
        if (tabCount) tabCount.textContent = user.followersCount;
      } catch (err) {
        showToast(err.message || 'Follow action failed', 'error');
      } finally {
        followBtn.disabled = false;
      }
    };
  }

  // Edit Profile button
  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) {
    editBtn.onclick = () => {
      openEditModal(user);
    };
  }

  // Re-bind tab clicks
  setupTabs();
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.profile-tab-btn');
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      switchTab(currentTab);
    };
  });
}

async function switchTab(tab) {
  const contentArea = document.getElementById('profile-tab-content');
  if (!contentArea || !profileUser) return;

  if (tab === 'posts') {
    await loadUserPosts(profileUser._id, contentArea);
  } else if (tab === 'followers') {
    await loadUserFollowers(profileUser._id, contentArea);
  } else if (tab === 'following') {
    await loadUserFollowing(profileUser._id, contentArea);
  }
}

// Tab: User Posts
async function loadUserPosts(userId, container) {
  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      Loading posts...
    </div>
  `;

  try {
    const res = await api.posts.getAll({ author: userId });
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3 class="empty-state-title">No posts yet</h3>
            <p class="empty-state-text">This user has not shared any updates.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${res.data.map(p => posts.renderPostCard(p)).join('')}
        </div>
      `;
      posts.bindPostEvents(container);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--accent-red);">${escapeHTML(err.message)}</div>`;
  }
}

// Tab: User Followers
async function loadUserFollowers(userId, container) {
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading followers...</div>`;

  try {
    const res = await api.users.getFollowers(userId);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h3 class="empty-state-title">No followers yet</h3>
            <p class="empty-state-text">When people follow this user, they'll appear here.</p>
          </div>
        `;
        return;
      }

      renderUserList(res.data, container);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--accent-red);">${escapeHTML(err.message)}</div>`;
  }
}

// Tab: User Following
async function loadUserFollowing(userId, container) {
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading following...</div>`;

  try {
    const res = await api.users.getFollowing(userId);
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">👤</div>
            <h3 class="empty-state-title">Not following anyone yet</h3>
            <p class="empty-state-text">Users followed will show up here.</p>
          </div>
        `;
        return;
      }

      renderUserList(res.data, container);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--accent-red);">${escapeHTML(err.message)}</div>`;
  }
}

function renderUserList(usersList, container) {
  container.innerHTML = `
    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden;">
      ${usersList.map(u => `
        <div class="search-item">
          <div class="search-user-info">
            <a href="/profile.html?id=${u._id}">
              <img src="${u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}" class="avatar" alt="${escapeHTML(u.name)}" />
            </a>
            <div>
              <a href="/profile.html?id=${u._id}" style="font-weight: 700; font-size: 0.95rem; display: block;">${escapeHTML(u.name)}</a>
              <span style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHTML(u.username)}</span>
              ${u.bio ? `<p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${escapeHTML(u.bio)}</p>` : ''}
            </div>
          </div>
          <div>
            ${!u.isSelf ? `
              <button class="btn ${u.isFollowing ? 'btn-secondary' : 'btn-outline'} btn-sm user-list-follow-btn" data-id="${u._id}" data-following="${u.isFollowing ? 'true' : 'false'}">
                ${u.isFollowing ? 'Following' : 'Follow'}
              </button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Bind follow buttons inside user list
  container.querySelectorAll('.user-list-follow-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!auth.isAuthenticated()) {
        showToast('Please log in to follow users', 'info');
        return;
      }

      const targetId = btn.dataset.id;
      const isFollowing = btn.dataset.following === 'true';

      btn.disabled = true;
      try {
        if (isFollowing) {
          await api.users.unfollow(targetId);
          btn.textContent = 'Follow';
          btn.className = 'btn btn-outline btn-sm user-list-follow-btn';
          btn.dataset.following = 'false';
          showToast('Unfollowed user', 'info');
        } else {
          await api.users.follow(targetId);
          btn.textContent = 'Following';
          btn.className = 'btn btn-secondary btn-sm user-list-follow-btn';
          btn.dataset.following = 'true';
          showToast('Followed user', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
      } finally {
        btn.disabled = false;
      }
    };
  });
}

// Edit Profile Modal
function setupEditProfileModal() {
  const overlay = document.getElementById('edit-profile-modal-overlay');
  const closeBtn = document.getElementById('close-edit-modal-btn');
  const form = document.getElementById('edit-profile-form');

  if (closeBtn && overlay) {
    closeBtn.onclick = () => overlay.classList.remove('open');
  }

  if (form && overlay) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name-input').value.trim();
      const bio = document.getElementById('edit-bio-input').value.trim();
      const avatar = document.getElementById('edit-avatar-input').value.trim();

      try {
        const currentUser = auth.getUser();
        const res = await api.users.updateProfile(currentUser._id, { name, bio, avatar });
        if (res.success && res.data) {
          overlay.classList.remove('open');
          showToast('Profile updated successfully!', 'success');
          // Update cached user session
          await auth.refreshUser();
          setTimeout(() => location.reload(), 500);
        }
      } catch (err) {
        showToast(err.message || 'Failed to update profile', 'error');
      }
    };
  }
}

function openEditModal(user) {
  const overlay = document.getElementById('edit-profile-modal-overlay');
  if (!overlay) return;

  document.getElementById('edit-name-input').value = user.name || '';
  document.getElementById('edit-bio-input').value = user.bio || '';
  document.getElementById('edit-avatar-input').value = user.avatar || '';

  overlay.classList.add('open');
}
