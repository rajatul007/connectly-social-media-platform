// backend/routes/postRoutes.js
import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  likePost,
  unlikePost
} from '../controllers/postController.js';
import {
  addComment,
  getComments
} from '../controllers/commentController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(optionalAuth, getPosts);

router.route('/:id')
  .get(optionalAuth, getPostById)
  .delete(protect, deletePost);

router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);

// Comments nested routes under posts
router.route('/:postId/comments')
  .post(protect, addComment)
  .get(getComments);

export default router;
