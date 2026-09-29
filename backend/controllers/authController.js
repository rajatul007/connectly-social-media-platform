// backend/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

// Helper to generate signed JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'connectly_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Validate presence
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, username, email, password)',
        error: 'Validation failed'
      });
    }

    // Password confirmation match
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        error: 'Validation failed'
      });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        error: 'Weak password'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        error: 'Invalid email'
      });
    }

    // Username format check
    const usernameClean = username.toLowerCase().trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(usernameClean)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        error: 'Invalid username'
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        error: 'Duplicate email'
      });
    }

    // Check duplicate username
    const existingUsername = await User.findOne({ username: usernameClean });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another.',
        error: 'Duplicate username'
      });
    }

    // Create user
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=6366f1,3b82f6,ec4899`;
    const user = await User.create({
      name: name.trim(),
      username: usernameClean,
      email: email.toLowerCase().trim(),
      password,
      avatar,
      bio: ''
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/username and password',
        error: 'Missing credentials'
      });
    }

    const identifier = emailOrUsername.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with that email or username.',
        error: 'Authentication failed'
      });
    }

    // In mongoose or memory, verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
        error: 'Authentication failed'
      });
    }

    const token = generateToken(user._id);
    const postsCount = await Post.countByAuthor(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: user.followers ? user.followers.length : 0,
          followingCount: user.following ? user.following.length : 0,
          postsCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: 'Not found'
      });
    }

    const postsCount = await Post.countByAuthor(user._id);

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
        followers: user.followers || [],
        following: user.following || [],
        postsCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
