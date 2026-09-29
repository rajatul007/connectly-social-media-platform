// backend/controllers/userController.js
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

// @desc    Get user profile by ID or username
// @route   GET /api/users/:id
// @access  Public (Optional Auth for isFollowing)
export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user;

    // Check if ID is 24-hex or if it's a username query
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ username: id.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not found'
      });
    }

    const postsCount = await Post.countByAuthor(user._id);
    const currentUserId = req.user ? req.user._id.toString() : null;
    const isFollowing = currentUserId
      ? (user.followers || []).some(fid => fid.toString() === currentUserId)
      : false;
    const isSelf = currentUserId === user._id.toString();

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: isSelf ? user.email : undefined,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: (user.followers || []).length,
        followingCount: (user.following || []).length,
        postsCount,
        isFollowing,
        isSelf,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (Own profile only)
export const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, bio, avatar } = req.body;

    if (req.user._id.toString() !== id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own profile.',
        error: 'Unauthorized update'
      });
    }

    const updateData = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
          error: 'Validation error'
        });
      }
      updateData.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 160) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 160 characters',
          error: 'Validation error'
        });
      }
      updateData.bio = bio.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by name or username
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        message: 'Search query empty',
        data: []
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const users = await User.search(query, currentUserId);

    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: (u.followers || []).length,
      isFollowing: currentUserId ? (u.followers || []).some(fid => fid.toString() === currentUserId) : false,
      isSelf: currentUserId === u._id.toString()
    }));

    return res.status(200).json({
      success: true,
      message: 'Search results fetched',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggested
// @access  Public (Optionally filtered for current user)
export const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    const users = await User.getSuggested(currentUserId, 5);

    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: (u.followers || []).length,
      isFollowing: currentUserId ? (u.followers || []).some(fid => fid.toString() === currentUserId.toString()) : false
    }));

    return res.status(200).json({
      success: true,
      message: 'Suggested users retrieved',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
        error: 'Invalid action'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user does not exist',
        error: 'Not found'
      });
    }

    await User.follow(targetUserId, currentUserId);
    const updatedTarget = await User.findById(targetUserId);

    return res.status(200).json({
      success: true,
      message: `You are now following @${targetUser.username}`,
      data: {
        isFollowing: true,
        followersCount: (updatedTarget.followers || []).length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself',
        error: 'Invalid action'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user does not exist',
        error: 'Not found'
      });
    }

    await User.unfollow(targetUserId, currentUserId);
    const updatedTarget = await User.findById(targetUserId);

    return res.status(200).json({
      success: true,
      message: `You have unfollowed @${targetUser.username}`,
      data: {
        isFollowing: false,
        followersCount: (updatedTarget.followers || []).length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers list
// @route   GET /api/users/:id/followers
// @access  Public
export const getUserFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followers = await User.getFollowers(id);
    const currentUserId = req.user ? req.user._id.toString() : null;

    const formatted = followers.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: currentUserId ? (u.followers || []).some(fid => fid.toString() === currentUserId) : false,
      isSelf: currentUserId === u._id.toString()
    }));

    return res.status(200).json({
      success: true,
      message: 'Followers retrieved',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's following list
// @route   GET /api/users/:id/following
// @access  Public
export const getUserFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const following = await User.getFollowing(id);
    const currentUserId = req.user ? req.user._id.toString() : null;

    const formatted = following.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: currentUserId ? (u.followers || []).some(fid => fid.toString() === currentUserId) : false,
      isSelf: currentUserId === u._id.toString()
    }));

    return res.status(200).json({
      success: true,
      message: 'Following retrieved',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
