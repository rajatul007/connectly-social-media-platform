// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { memoryStore, generateObjectId } from '../config/db.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: [160, 'Bio cannot exceed 160 characters']
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Universal repository wrapper ensuring seamless operation in both real MongoDB and In-Memory mode
export const User = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.create(data);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newUser = {
      _id: generateObjectId(),
      name: data.name.trim(),
      username: data.username.toLowerCase().trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      bio: data.bio || '',
      followers: [],
      following: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.users.push(newUser);
    return { ...newUser };
  },

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findOne(query);
    }
    return memoryStore.users.find(u => {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
      if (query.username && u.username.toLowerCase() === query.username.toLowerCase()) return true;
      if (query.$or) {
        return query.$or.some(cond => {
          if (cond.email && u.email.toLowerCase() === cond.email.toLowerCase()) return true;
          if (cond.username && u.username.toLowerCase() === cond.username.toLowerCase()) return true;
          return false;
        });
      }
      return false;
    }) || null;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findById(id).select('-password');
    }
    const user = memoryStore.users.find(u => u._id.toString() === id.toString());
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async findByIdWithPassword(id) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findById(id);
    }
    return memoryStore.users.find(u => u._id.toString() === id.toString()) || null;
  },

  async findByIdAndUpdate(id, updateData) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }
    const user = memoryStore.users.find(u => u._id.toString() === id.toString());
    if (!user) return null;
    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.bio !== undefined) user.bio = updateData.bio;
    if (updateData.avatar !== undefined) user.avatar = updateData.avatar;
    user.updatedAt = new Date();
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async search(query, currentUserId) {
    const q = (query || '').toLowerCase().trim();
    if (mongoose.connection.readyState === 1) {
      return await UserModel.find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } }
        ]
      }).select('-password').limit(15);
    }
    return memoryStore.users
      .filter(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
      .slice(0, 15)
      .map(({ password, ...rest }) => rest);
  },

  async getSuggested(currentUserId, limit = 5) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.find({
        _id: { $ne: currentUserId }
      }).select('-password').limit(limit);
    }
    return memoryStore.users
      .filter(u => u._id.toString() !== currentUserId?.toString())
      .slice(0, limit)
      .map(({ password, ...rest }) => rest);
  },

  async follow(targetUserId, currentUserId) {
    if (mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
      await UserModel.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      return true;
    }
    const target = memoryStore.users.find(u => u._id.toString() === targetUserId.toString());
    const current = memoryStore.users.find(u => u._id.toString() === currentUserId.toString());
    if (!target || !current) return false;

    if (!target.followers.some(id => id.toString() === currentUserId.toString())) {
      target.followers.push(currentUserId.toString());
    }
    if (!current.following.some(id => id.toString() === targetUserId.toString())) {
      current.following.push(targetUserId.toString());
    }
    return true;
  },

  async unfollow(targetUserId, currentUserId) {
    if (mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      await UserModel.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      return true;
    }
    const target = memoryStore.users.find(u => u._id.toString() === targetUserId.toString());
    const current = memoryStore.users.find(u => u._id.toString() === currentUserId.toString());
    if (!target || !current) return false;

    target.followers = target.followers.filter(id => id.toString() !== currentUserId.toString());
    current.following = current.following.filter(id => id.toString() !== targetUserId.toString());
    return true;
  },

  async getFollowers(userId) {
    const user = await this.findById(userId);
    if (!user) return [];
    if (mongoose.connection.readyState === 1) {
      const populated = await UserModel.findById(userId).populate('followers', '-password');
      return populated ? populated.followers : [];
    }
    return memoryStore.users
      .filter(u => user.followers.map(id => id.toString()).includes(u._id.toString()))
      .map(({ password, ...rest }) => rest);
  },

  async getFollowing(userId) {
    const user = await this.findById(userId);
    if (!user) return [];
    if (mongoose.connection.readyState === 1) {
      const populated = await UserModel.findById(userId).populate('following', '-password');
      return populated ? populated.following : [];
    }
    return memoryStore.users
      .filter(u => user.following.map(id => id.toString()).includes(u._id.toString()))
      .map(({ password, ...rest }) => rest);
  }
};

export default User;
