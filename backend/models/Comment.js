// backend/models/Comment.js
import mongoose from 'mongoose';
import { memoryStore, generateObjectId } from '../config/db.js';
import { User } from './User.js';

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [300, 'Comment cannot exceed 300 characters']
    }
  },
  {
    timestamps: true
  }
);

commentSchema.index({ post: 1, createdAt: 1 });

export const CommentModel = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export const Comment = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const created = await CommentModel.create(data);
      return await created.populate('author', 'name username avatar');
    }
    const authorUser = await User.findById(data.author);
    const newComment = {
      _id: generateObjectId(),
      post: data.post.toString(),
      author: data.author.toString(),
      text: data.text.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.comments.push(newComment);
    return {
      ...newComment,
      author: authorUser
        ? { _id: authorUser._id, name: authorUser.name, username: authorUser.username, avatar: authorUser.avatar }
        : null
    };
  },

  async findByPost(postId) {
    if (mongoose.connection.readyState === 1) {
      return await CommentModel.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate('author', 'name username avatar');
    }

    const comments = memoryStore.comments.filter(c => c.post.toString() === postId.toString());
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return await Promise.all(
      comments.map(async c => {
        const authorUser = await User.findById(c.author);
        return {
          _id: c._id,
          post: c.post,
          text: c.text,
          createdAt: c.createdAt,
          author: authorUser
            ? { _id: authorUser._id, name: authorUser.name, username: authorUser.username, avatar: authorUser.avatar }
            : { _id: c.author, name: 'Anonymous', username: 'anonymous', avatar: '' }
        };
      })
    );
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await CommentModel.findById(id);
    }
    return memoryStore.comments.find(c => c._id.toString() === id.toString()) || null;
  },

  async delete(id) {
    if (mongoose.connection.readyState === 1) {
      return await CommentModel.findByIdAndDelete(id);
    }
    const index = memoryStore.comments.findIndex(c => c._id.toString() === id.toString());
    if (index === -1) return null;
    return memoryStore.comments.splice(index, 1)[0];
  }
};

export default Comment;
