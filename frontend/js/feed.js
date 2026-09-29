// frontend/js/feed.js
import { api } from './api.js';
import { auth } from './auth.js';
import { posts } from './posts.js';
import { showToast, escapeHTML } from './main.js';

let currentFeedFilter = 'all'; // 'all' or 'following'
let currentPage = 1;
let hasMorePosts = false;
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
  await initFeedPage();
});

async function initFeedPage() {
  setupLeftSidebarProfile();
  setupCreatePostCard();
  setupFeedFilterTabs();
  setupLoadMoreButton();
  setupReseedButton();
  loadSuggestedUsers();
  await loadPosts(1, false);
}

// Populate left sidebar profile card
function setupLeftSidebarProfile() {
  const container = document.getElementById('sidebar-profile-container');
  if (!container) return;

  const user = auth.getUser();
  if (!user) {
    container.innerHTML = `
      <div class="sidebar-card" style="text-align: center;">
        <h4 style="font-size: 1rem; margin-bottom: 8px;">Welcome to Connectly</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">Connect with engineers and share what you are building.</p>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <a href="/login.html" class="btn btn-secondary btn-sm" style="flex: 1;">Log in</a>
          <a href="/register.html" class="btn btn-primary btn-sm" style="flex: 1;">Sign up</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="sidebar-card profile-card-mini">
      <div class="profile-card-mini-banner"></div>
      <a href="/profile.html?id=${user._id}">
        <img src="${user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}" class="avatar avatar-lg profile-card-mini-avatar" alt="${escapeHTML(user.name)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}'" />
      </a>
      <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 2px;">
        <a href="/profile.html?id=${user._id}">${escapeHTML(user.name)}</a>
      </h3>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">@${escapeHTML(user.username)}</p>
      
      <div class="profile-stats-grid">
        <a href="/profile.html?id=${user._id}&tab=posts" class="stat-item">
          <span class="stat-value" id="mini-posts-count">${user.postsCount || 0}</span>
          <span class="stat-label">Posts</span>
        </a>
        <a href="/profile.html?id=${user._id}&tab=followers" class="stat-item">
          <span class="stat-value" id="mini-followers-count">${user.followersCount || 0}</span>
          <span class="stat-label">Followers</span>
        </a>
        <a href="/profile.html?id=${user._id}&tab=following" class="stat-item">
          <span class="stat-value" id="mini-following-count">${user.followingCount || 0}</span>
          <span class="stat-label">Following</span>
        </a>
      </div>
    </div>
  `;

  // Refresh in background to sync counts
  auth.refreshUser().then(fresh => {
    if (fresh) {
      const pc = document.getElementById('mini-posts-count');
      const fc = document.getElementById('mini-followers-count');
      const fgc = document.getElementById('mini-following-count');
      if (pc) pc.textContent = fresh.postsCount || 0;
      if (fc) fc.textContent = fresh.followersCount || (fresh.followers ? fresh.followers.length : 0);
      if (fgc) fgc.textContent = fresh.followingCount || (fresh.following ? fresh.following.length : 0);
    }
  });
}

// Setup Create Post widget
function setupCreatePostCard() {
  const card = document.getElementById('create-post-card');
  if (!card) return;

  if (!auth.isAuthenticated()) {
    card.style.display = 'none';
    return;
  }

  const currentUser = auth.getUser();
  const avatarEl = card.querySelector('#create-post-avatar');
  if (avatarEl && currentUser) {
    avatarEl.src = currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`;
  }

  const textarea = document.getElementById('post-content-input');
  const charCounter = document.getElementById('char-counter');
  const imageToggleBtn = document.getElementById('toggle-image-input-btn');
  const imageInputRow = document.getElementById('image-input-row');
  const imageUrlInput = document.getElementById('image-url-input');
  const imagePreview = document.getElementById('image-preview');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const submitBtn = document.getElementById('submit-post-btn');

  // Character counter
  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCounter.textContent = `${len}/500`;
      charCounter.className = 'char-counter';
      if (len > 450) charCounter.classList.add('warning');
      if (len >= 500) charCounter.classList.add('danger');
      if (submitBtn) submitBtn.disabled = len === 0 || len > 500;
    });
  }

  // Image input toggle
  if (imageToggleBtn && imageInputRow) {
    imageToggleBtn.addEventListener('click', () => {
      const isVisible = imageInputRow.classList.contains('visible');
      imageInputRow.classList.toggle('visible', !isVisible);
      if (!isVisible && imageUrlInput) imageUrlInput.focus();
    });
  }

  // Image URL input preview
  if (imageUrlInput && imagePreview && imagePreviewContainer) {
    imageUrlInput.addEventListener('input', () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        imagePreview.src = url;
        imagePreviewContainer.classList.add('visible');
      } else {
        imagePreviewContainer.classList.remove('visible');
      }
    });
  }

  // Remove attached image
  if (removeImageBtn && imageUrlInput && imagePreviewContainer) {
    removeImageBtn.addEventListener('click', () => {
      imageUrlInput.value = '';
      imagePreview.src = '';
      imagePreviewContainer.classList.remove('visible');
    });
  }

  // Submit Post
  const form = document.getElementById('create-post-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = textarea.value.trim();
      const image = imageUrlInput ? imageUrlInput.value.trim() : '';

      if (!content) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `Posting...`;

      try {
        const res = await api.posts.create({ content, image });
        if (res.success && res.data) {
          textarea.value = '';
          if (imageUrlInput) imageUrlInput.value = '';
          if (imagePreviewContainer) imagePreviewContainer.classList.remove('visible');
          if (imageInputRow) imageInputRow.classList.remove('visible');
          charCounter.textContent = '0/500';

          // Prepend new post to the feed
          const feedList = document.getElementById('feed-posts-list');
          if (feedList) {
            const emptyState = feedList.querySelector('.empty-state');
            if (emptyState) emptyState.remove();

            const postHTML = posts.renderPostCard(res.data);
            feedList.insertAdjacentHTML('afterbegin', postHTML);
            posts.bindPostEvents(feedList);
          }

          // Update mini profile count
          const miniPostsCount = document.getElementById('mini-posts-count');
          if (miniPostsCount) {
            miniPostsCount.textContent = (parseInt(miniPostsCount.textContent, 10) || 0) + 1;
          }

          showToast('Post published successfully!', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Failed to publish post', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Post`;
      }
    });
  }
}

// Feed Filter Tabs: All vs Following
function setupFeedFilterTabs() {
  const tabs = document.querySelectorAll('.feed-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      if (tab.dataset.feed === currentFeedFilter) return;

      if (tab.dataset.feed === 'following' && !auth.isAuthenticated()) {
        showToast('Please log in to view posts from people you follow', 'info');
        return;
      }

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentFeedFilter = tab.dataset.feed;
      currentPage = 1;
      await loadPosts(1, false);
    });
  });
}

// Load Posts from API
async function loadPosts(page = 1, append = false) {
  const feedList = document.getElementById('feed-posts-list');
  const loadMoreBtn = document.getElementById('load-more-posts-btn');
  if (!feedList) return;

  if (!append) {
    feedList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <div style="display: inline-block; width: 28px; height: 28px; border: 3px solid var(--primary-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 10px; font-size: 0.9rem;">Loading feed...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  }

  isLoading = true;
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  try {
    const res = await api.posts.getAll({
      page,
      limit: 10,
      feed: currentFeedFilter
    });

    if (res.success && res.data) {
      hasMorePosts = res.pagination ? res.pagination.hasMore : false;
      currentPage = page;

      if (!append && res.data.length === 0) {
        feedList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h3 class="empty-state-title">No posts here yet</h3>
            <p class="empty-state-text">
              ${currentFeedFilter === 'following' 
                ? "You haven't followed anyone with posts yet, or the people you follow haven't posted." 
                : "Be the first one to share an update with the community!"}
            </p>
            ${currentFeedFilter === 'following' 
              ? `<button class="btn btn-secondary btn-sm" onclick="document.querySelector('[data-feed=all]').click()">Explore All Posts</button>`
              : ''}
          </div>
        `;
      } else {
        const postsHTML = res.data.map(p => posts.renderPostCard(p)).join('');
        if (append) {
          feedList.insertAdjacentHTML('beforeend', postsHTML);
        } else {
          feedList.innerHTML = postsHTML;
        }
        posts.bindPostEvents(feedList);
      }

      if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMorePosts ? 'inline-flex' : 'none';
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = `Load More Posts`;
      }
    }
  } catch (err) {
    if (!append) {
      feedList.innerHTML = `
        <div class="empty-state" style="border-color: var(--accent-red);">
          <h3 class="empty-state-title" style="color: var(--accent-red);">Could not load posts</h3>
          <p class="empty-state-text">${escapeHTML(err.message || 'Server connection error')}</p>
          <button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    showToast(err.message || 'Failed to fetch posts', 'error');
  } finally {
    isLoading = false;
  }
}

// Load more button setup
function setupLoadMoreButton() {
  const btn = document.getElementById('load-more-posts-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (isLoading || !hasMorePosts) return;
    btn.innerHTML = `Loading...`;
    await loadPosts(currentPage + 1, true);
  });
}

// Suggested users in right sidebar
async function loadSuggestedUsers() {
  const container = document.getElementById('suggested-users-container');
  if (!container) return;

  try {
    const res = await api.users.getSuggested();
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">No suggestions available</p>`;
        return;
      }

      container.innerHTML = res.data.map(u => `
        <div class="suggested-user-item" id="suggested-user-${u._id}">
          <div class="suggested-user-details">
            <a href="/profile.html?id=${u._id}">
              <img src="${u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}" class="avatar avatar-sm" alt="${escapeHTML(u.name)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}'" />
            </a>
            <div class="suggested-user-names">
              <a href="/profile.html?id=${u._id}" class="suggested-name">${escapeHTML(u.name)}</a>
              <span class="suggested-username">@${escapeHTML(u.username)}</span>
            </div>
          </div>
          <button class="btn ${u.isFollowing ? 'btn-secondary' : 'btn-outline'} btn-sm follow-toggle-btn" data-id="${u._id}" data-following="${u.isFollowing ? 'true' : 'false'}">
            ${u.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `).join('');

      // Bind follow toggles
      container.querySelectorAll('.follow-toggle-btn').forEach(btn => {
        btn.onclick = async () => {
          if (!auth.isAuthenticated()) {
            showToast('Please log in to follow users', 'info');
            return;
          }

          const targetUserId = btn.dataset.id;
          const isFollowing = btn.dataset.following === 'true';

          btn.disabled = true;
          try {
            if (isFollowing) {
              await api.users.unfollow(targetUserId);
              btn.textContent = 'Follow';
              btn.className = 'btn btn-outline btn-sm follow-toggle-btn';
              btn.dataset.following = 'false';
              showToast('Unfollowed user', 'info');
            } else {
              await api.users.follow(targetUserId);
              btn.textContent = 'Following';
              btn.className = 'btn btn-secondary btn-sm follow-toggle-btn';
              btn.dataset.following = 'true';
              showToast('Now following!', 'success');
            }
          } catch (err) {
            showToast(err.message || 'Action failed', 'error');
          } finally {
            btn.disabled = false;
          }
        };
      });
    }
  } catch (err) {
    console.error('Failed to load suggested users:', err);
  }
}

// Reseed demo data button
function setupReseedButton() {
  const reseedBtn = document.getElementById('reseed-demo-btn');
  if (!reseedBtn) return;

  reseedBtn.addEventListener('click', async () => {
    reseedBtn.disabled = true;
    reseedBtn.textContent = 'Resetting...';
    try {
      const res = await api.seed();
      showToast(res.message || 'Demo data reseeded!', 'success');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showToast(err.message || 'Failed to reseed', 'error');
      reseedBtn.disabled = false;
      reseedBtn.textContent = 'Reset Demo Data';
    }
  });
}
