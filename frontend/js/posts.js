// frontend/js/posts.js
import { api } from './api.js';
import { auth } from './auth.js';
import { showToast, formatRelativeTime, escapeHTML, confirmAction } from './main.js';

export const posts = {
  // Render a single post card HTML string
  renderPostCard(post) {
    const currentUser = auth.getUser();
    const currentUserId = currentUser?._id;
    const authorId = post.author?._id || post.author;
    const isOwner = currentUserId && authorId && currentUserId.toString() === authorId.toString();

    const authorName = post.author?.name || 'Anonymous';
    const authorUsername = post.author?.username || 'user';
    const authorAvatar = post.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

    return `
      <article class="post-card" id="post-${post._id}" data-post-id="${post._id}">
        <div class="post-header">
          <div class="post-author-block">
            <a href="/profile.html?id=${authorId}">
              <img src="${authorAvatar}" class="avatar" alt="${escapeHTML(authorName)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}'" />
            </a>
            <div>
              <a href="/profile.html?id=${authorId}" class="post-author-name">${escapeHTML(authorName)}</a>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="post-author-username">@${escapeHTML(authorUsername)}</span>
                <span style="color: var(--text-muted); font-size: 0.75rem;">•</span>
                <span class="post-time">${formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          ${isOwner ? `
            <button class="btn-icon delete-post-btn" data-id="${post._id}" title="Delete Post" style="width: 32px; height: 32px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            </button>
          ` : ''}
        </div>

        <div class="post-content">${escapeHTML(post.content)}</div>

        ${post.image ? `
          <div class="post-image-wrapper">
            <img src="${post.image}" alt="Post attachment" loading="lazy" onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ''}

        <div class="post-actions">
          <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-id="${post._id}">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="likes-count">${post.likesCount || 0}</span>
          </button>

          <button class="action-btn comment-toggle-btn" data-id="${post._id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="comments-count">${post.commentsCount || 0}</span>
          </button>

          <a href="/post.html?id=${post._id}" class="action-btn" title="View thread" style="margin-left: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            <span>Thread</span>
          </a>
        </div>

        <!-- Collapsible Comments Section -->
        <div class="comments-section" id="comments-${post._id}">
          ${auth.isAuthenticated() ? `
            <form class="comment-input-row comment-form" data-post-id="${post._id}">
              <img src="${currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name}`}" class="avatar avatar-sm" alt="My avatar" />
              <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="300" required />
              <button type="submit" class="btn btn-primary btn-sm">Send</button>
            </form>
          ` : `
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
              <a href="/login.html" style="color: var(--primary); font-weight: 600;">Log in</a> to comment
            </div>
          `}
          <div class="comments-list" id="comments-list-${post._id}">
            <div style="font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 8px;">Loading comments...</div>
          </div>
        </div>
      </article>
    `;
  },

  // Attach interactive listeners to post cards in a given container
  bindPostEvents(container) {
    // Like button handling
    container.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        if (!auth.isAuthenticated()) {
          showToast('Please log in to like posts', 'info');
          return;
        }

        const postId = btn.dataset.id;
        const countSpan = btn.querySelector('.likes-count');
        const isLiked = btn.classList.contains('liked');

        // Optimistic UI update
        btn.classList.toggle('liked', !isLiked);
        let count = parseInt(countSpan.textContent, 10) || 0;
        countSpan.textContent = isLiked ? Math.max(0, count - 1) : count + 1;

        try {
          if (isLiked) {
            await api.posts.unlike(postId);
          } else {
            await api.posts.like(postId);
          }
        } catch (err) {
          // Revert optimistic update on failure
          btn.classList.toggle('liked', isLiked);
          countSpan.textContent = count;
          showToast(err.message || 'Failed to update like', 'error');
        }
      };
    });

    // Delete post handling
    container.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const postId = btn.dataset.id;
        const confirmed = await confirmAction('Delete Post', 'Are you sure you want to permanently delete this post? This cannot be undone.', 'Delete');
        if (!confirmed) return;

        try {
          const res = await api.posts.delete(postId);
          if (res.success) {
            const card = document.getElementById(`post-${postId}`);
            if (card) {
              card.style.opacity = '0';
              card.style.transform = 'scale(0.95)';
              card.style.transition = 'all 0.25s ease';
              setTimeout(() => card.remove(), 250);
            }
            showToast('Post deleted successfully', 'success');
          }
        } catch (err) {
          showToast(err.message || 'Failed to delete post', 'error');
        }
      };
    });

    // Toggle comments section
    container.querySelectorAll('.comment-toggle-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const postId = btn.dataset.id;
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        const isOpen = commentsSection.classList.contains('open');
        commentsSection.classList.toggle('open', !isOpen);

        if (!isOpen) {
          await this.loadPostComments(postId);
        }
      };
    });

    // Submit comment form
    container.querySelectorAll('.comment-form').forEach(form => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        if (!auth.isAuthenticated()) {
          showToast('Please log in to add comments', 'info');
          return;
        }

        const postId = form.dataset.postId;
        const input = form.querySelector('.comment-input');
        const text = input.value.trim();
        if (!text) return;

        input.disabled = true;
        try {
          const res = await api.comments.create(postId, text);
          if (res.success && res.data) {
            input.value = '';
            // Append newly created comment
            const list = document.getElementById(`comments-list-${postId}`);
            const commentHTML = this.renderCommentItem(res.data);
            list.insertAdjacentHTML('beforeend', commentHTML);
            
            // Increment comment count badge
            const postCard = document.getElementById(`post-${postId}`);
            const countBadge = postCard?.querySelector('.comments-count');
            if (countBadge) {
              countBadge.textContent = (parseInt(countBadge.textContent, 10) || 0) + 1;
            }

            this.bindCommentEvents(list);
            showToast('Comment posted', 'success');
          }
        } catch (err) {
          showToast(err.message || 'Failed to post comment', 'error');
        } finally {
          input.disabled = false;
          input.focus();
        }
      };
    });
  },

  // Load comments for a post card
  async loadPostComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    if (!list) return;

    try {
      const res = await api.comments.getByPost(postId);
      if (res.success && res.data) {
        if (res.data.length === 0) {
          list.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px;">No comments yet. Start the conversation!</div>`;
        } else {
          list.innerHTML = res.data.map(c => this.renderCommentItem(c)).join('');
          this.bindCommentEvents(list);
        }
      }
    } catch (err) {
      list.innerHTML = `<div style="color: var(--accent-red); font-size: 0.82rem; text-align: center;">Failed to load comments</div>`;
    }
  },

  // Render a comment element
  renderCommentItem(comment) {
    const currentUser = auth.getUser();
    const isCommentOwner = currentUser && (comment.author?._id || comment.author).toString() === currentUser._id.toString();

    const authorName = comment.author?.name || 'Anonymous';
    const authorAvatar = comment.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

    return `
      <div class="comment-item" id="comment-${comment._id}">
        <img src="${authorAvatar}" class="avatar avatar-sm" alt="${escapeHTML(authorName)}" />
        <div class="comment-bubble">
          <div class="comment-header">
            <span class="comment-author-name">${escapeHTML(authorName)}</span>
            <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
          </div>
          <div class="comment-text">${escapeHTML(comment.text)}</div>
        </div>
        ${isCommentOwner ? `
          <button class="btn-icon comment-delete-btn" data-comment-id="${comment._id}" title="Delete comment" style="width: 24px; height: 24px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        ` : ''}
      </div>
    `;
  },

  // Bind comment deletion
  bindCommentEvents(container) {
    container.querySelectorAll('.comment-delete-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const commentId = btn.dataset.commentId;
        const confirmed = await confirmAction('Delete Comment', 'Remove this comment permanently?', 'Delete');
        if (!confirmed) return;

        try {
          const res = await api.comments.delete(commentId);
          if (res.success) {
            const commentEl = document.getElementById(`comment-${commentId}`);
            if (commentEl) commentEl.remove();
            showToast('Comment removed', 'success');
          }
        } catch (err) {
          showToast(err.message || 'Failed to delete comment', 'error');
        }
      };
    });
  }
};

export default posts;
