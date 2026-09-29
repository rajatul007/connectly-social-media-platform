// backend/models/Post.js
import mongoose from 'mongoose';
import { memoryStore, generateObjectId } from '../config/db.js';
import { User } from './User.js';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty'],
      trim: true,
      maxlength: [500, 'Post content cannot exceed 500 characters']
    },
    image: {
      type: String,
      default: ''
    },
    likes: [
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

postSchema.index({ createdAt: -1 });

export const PostModel = mongoose.models.Post || mongoose.model('Post', postSchema);

export const Post = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const created = await PostModel.create(data);
      return await created.populate('author', 'name username avatar');
    }
    const authorUser = await User.findById(data.author);
    const newPost = {
      _id: generateObjectId(),
      author: data.author.toString(),
      content: data.content.trim(),
      image: data.image || '',
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.posts.unshift(newPost);
    return {
      ...newPost,
      author: authorUser
        ? { _id: authorUser._id, name: authorUser.name, username: authorUser.username, avatar: authorUser.avatar }
        : null,
      likesCount: 0,
      commentsCount: 0
    };
  },

  async find({ filter = {}, page = 1, limit = 10, currentUserId = null, followingIds = [] }) {
    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (filter.author) {
        query.author = filter.author;
      } else if (filter.feed === 'following' && followingIds.length > 0) {
        query.author = { $in: followingIds };
      }

      const total = await PostModel.countDocuments(query);
      const posts = await PostModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name username avatar');

      return {
        posts: posts.map(p => ({
          ...p.toObject(),
          likesCount: p.likes.length,
          isLiked: currentUserId ? p.likes.some(id => id.toString() === currentUserId.toString()) : false
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }

    // In-Memory implementation
    let list = [...memoryStore.posts];

    if (filter.author) {
      list = list.filter(p => p.author.toString() === filter.author.toString());
    } else if (filter.feed === 'following') {
      const allowedAuthors = new Set([...followingIds.map(id => id.toString()), currentUserId?.toString()].filter(Boolean));
      list = list.filter(p => allowedAuthors.has(p.author.toString()));
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    const populated = await Promise.all(
      paginated.map(async p => {
        const authorUser = await User.findById(p.author);
        const commentCount = memoryStore.comments.filter(c => c.post.toString() === p._id.toString()).length;
        const isLiked = currentUserId ? p.likes.some(id => id.toString() === currentUserId.toString()) : false;

        return {
          _id: p._id,
          content: p.content,
          image: p.image,
          likes: p.likes,
          likesCount: p.likes.length,
          isLiked,
          commentsCount: commentCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          author: authorUser
            ? {
                _id: authorUser._id,
                name: authorUser.name,
                username: authorUser.username,
                avatar: authorUser.avatar
              }
            : { _id: p.author, name: 'Anonymous', username: 'anonymous', avatar: '' }
        };
      })
    );

    return {
      posts: populated,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  async findById(id, currentUserId = null) {
    if (mongoose.connection.readyState === 1) {
      const post = await PostModel.findById(id).populate('author', 'name username avatar');
      if (!post) return null;
      return {
        ...post.toObject(),
        likesCount: post.likes.length,
        isLiked: currentUserId ? post.likes.some(uid => uid.toString() === currentUserId.toString()) : false
      };
    }

    const post = memoryStore.posts.find(p => p._id.toString() === id.toString());
    if (!post) return null;

    const authorUser = await User.findById(post.author);
    const commentCount = memoryStore.comments.filter(c => c.post.toString() === post._id.toString()).length;
    const isLiked = currentUserId ? post.likes.some(uid => uid.toString() === currentUserId.toString()) : false;

    return {
      _id: post._id,
      content: post.content,
      image: post.image,
      likes: post.likes,
      likesCount: post.likes.length,
      isLiked,
      commentsCount: commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: authorUser
        ? {
            _id: authorUser._id,
            name: authorUser.name,
            username: authorUser.username,
            avatar: authorUser.avatar
          }
        : { _id: post.author, name: 'Anonymous', username: 'anonymous', avatar: '' }
    };
  },

  async delete(id) {
    if (mongoose.connection.readyState === 1) {
      return await PostModel.findByIdAndDelete(id);
    }
    const index = memoryStore.posts.findIndex(p => p._id.toString() === id.toString());
    if (index === -1) return null;
    const [removed] = memoryStore.posts.splice(index, 1);
    // Also remove associated comments
    memoryStore.comments = memoryStore.comments.filter(c => c.post.toString() !== id.toString());
    return removed;
  },

  async like(postId, userId) {
    if (mongoose.connection.readyState === 1) {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      return updated ? updated.likes.length : 0;
    }

    const post = memoryStore.posts.find(p => p._id.toString() === postId.toString());
    if (!post) return 0;
    if (!post.likes.some(id => id.toString() === userId.toString())) {
      post.likes.push(userId.toString());
    }
    return post.likes.length;
  },

  async unlike(postId, userId) {
    if (mongoose.connection.readyState === 1) {
      const updated = await PostModel.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      return updated ? updated.likes.length : 0;
    }

    const post = memoryStore.posts.find(p => p._id.toString() === postId.toString());
    if (!post) return 0;
    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    return post.likes.length;
  },

  async countByAuthor(authorId) {
    if (mongoose.connection.readyState === 1) {
      return await PostModel.countDocuments({ author: authorId });
    }
    return memoryStore.posts.filter(p => p.author.toString() === authorId.toString()).length;
  }
};

export default Post;
