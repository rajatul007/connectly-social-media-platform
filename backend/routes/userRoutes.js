// backend/routes/userRoutes.js
import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getSuggestedUsers,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', optionalAuth, searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/:id', optionalAuth, getUserProfile);
router.put('/:id', protect, updateUserProfile);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/followers', optionalAuth, getUserFollowers);
router.get('/:id/following', optionalAuth, getUserFollowing);

export default router;
