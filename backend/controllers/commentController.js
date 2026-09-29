// backend/controllers/commentController.js
import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty',
        error: 'Validation failed'
      });
    }

    if (text.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 300 characters',
        error: 'Length limit exceeded'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text: text.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a specific post
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'Not found'
      });
    }

    const comments = await Comment.findByPost(postId);

    return res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Comment author or post author)
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id.toString();

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'Not found'
      });
    }

    const commentAuthorId = (comment.author?._id || comment.author).toString();

    // Fetch the post to check if user is the post author
    const post = await Post.findById(comment.post);
    const postAuthorId = post ? (post.author?._id || post.author).toString() : null;

    if (commentAuthorId !== currentUserId && postAuthorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own comments.',
        error: 'Forbidden'
      });
    }

    await Comment.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: { _id: id }
    });
  } catch (error) {
    next(error);
  }
};
