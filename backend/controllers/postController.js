// backend/controllers/postController.js
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty',
        error: 'Validation failed'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 500 characters',
        error: 'Length limit exceeded'
      });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image: image ? image.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Post published successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (paginated, with feed filter: all or following, or by author)
// @route   GET /api/posts
// @access  Public (Optional auth for personalized feed & like state)
export const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const feed = req.query.feed || 'all'; // 'all' or 'following'
    const author = req.query.author || null;

    let followingIds = [];
    const currentUserId = req.user ? req.user._id : null;

    if (currentUserId && feed === 'following') {
      const user = await User.findById(currentUserId);
      if (user && user.following) {
        followingIds = user.following;
      }
    }

    const filter = {};
    if (author) filter.author = author;
    if (feed === 'following') filter.feed = 'following';

    const result = await Post.find({
      filter,
      page,
      limit,
      currentUserId,
      followingIds
    });

    return res.status(200).json({
      success: true,
      message: 'Posts fetched successfully',
      data: result.posts,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public (Optional auth for like state)
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user._id : null;
    const post = await Post.findById(id, currentUserId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post details fetched',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Owner only)
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id.toString();

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    const postAuthorId = (post.author?._id || post.author).toString();

    if (postAuthorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own posts.',
        error: 'Forbidden'
      });
    }

    await Post.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: { _id: id }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    const likesCount = await Post.like(id, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Post liked',
      data: {
        postId: id,
        isLiked: true,
        likesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
export const unlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    const likesCount = await Post.unlike(id, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Post unliked',
      data: {
        postId: id,
        isLiked: false,
        likesCount
      }
    });
  } catch (error) {
    next(error);
  }
};
