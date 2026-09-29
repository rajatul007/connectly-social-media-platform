// backend/config/db.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Global in-memory storage fallback when MongoDB server is not running
export const memoryStore = {
  users: [],
  posts: [],
  comments: [],
  isMemoryMode: false
};

// Generate realistic MongoDB ObjectId (24 hex characters)
export function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomChars = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + randomChars;
}

// Seed the in-memory store with realistic demo data
export async function seedMemoryStore() {
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  const u1Id = '66f001010101010101010001';
  const u2Id = '66f001010101010101010002';
  const u3Id = '66f001010101010101010003';
  const u4Id = '66f001010101010101010004';
  const u5Id = '66f001010101010101010005';

  memoryStore.users = [
    {
      _id: u1Id,
      name: 'Alex Rivera',
      username: 'alexrivera',
      email: 'alex@connectly.app',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Full-stack developer & UI designer. Building scalable web apps and crafting clean digital experiences. 🚀',
      followers: [u2Id, u3Id, u4Id],
      following: [u2Id, u4Id],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      _id: u2Id,
      name: 'Sophia Chen',
      username: 'sophiacodes',
      email: 'sophia@connectly.app',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Software Engineering Intern @ TechCorp | Distributed systems enthusiast | Coffee lover ☕️',
      followers: [u1Id, u3Id],
      following: [u1Id, u3Id, u5Id],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    },
    {
      _id: u3Id,
      name: 'Marcus Vance',
      username: 'marcus_v',
      email: 'marcus@connectly.app',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Cloud Architect & Open Source contributor. Writing about Node.js, microservices, and databases.',
      followers: [u2Id, u4Id, u5Id],
      following: [u1Id, u2Id],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    },
    {
      _id: u4Id,
      name: 'Elena Rostova',
      username: 'elenadesigns',
      email: 'elena@connectly.app',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Designer obsessed with micro-interactions, accessibility, and minimalist typography. ✨',
      followers: [u1Id],
      following: [u1Id, u2Id, u3Id],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      _id: u5Id,
      name: 'David Kim',
      username: 'david_k',
      email: 'david@connectly.app',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'DevOps & security researcher. Passionate about automated CI/CD and secure coding standards.',
      followers: [u2Id],
      following: [u2Id, u3Id],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ];

  const p1Id = '66f002020202020202020001';
  const p2Id = '66f002020202020202020002';
  const p3Id = '66f002020202020202020003';
  const p4Id = '66f002020202020202020004';
  const p5Id = '66f002020202020202020005';
  const p6Id = '66f002020202020202020006';

  memoryStore.posts = [
    {
      _id: p1Id,
      author: u1Id,
      content: 'Excited to launch Connectly today! Built with a clean RESTful Express backend, modular vanilla JavaScript, and modern CSS. Feels great when everything clicks into place.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
      likes: [u2Id, u3Id, u4Id],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      _id: p2Id,
      author: u2Id,
      content: 'Finished reading through standard API design patterns. Key takeaway: consistent JSON responses with clear HTTP status codes make frontend integration a breeze! 💻',
      image: '',
      likes: [u1Id, u3Id],
      createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
    },
    {
      _id: p3Id,
      author: u4Id,
      content: 'Dark mode typography tip: Never use pure #FFFFFF on pure #000000. Use subtle off-whites like #F1F5F9 over rich deep slates like #0F172A to reduce visual fatigue.',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80',
      likes: [u1Id, u2Id, u5Id],
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
    },
    {
      _id: p4Id,
      author: u3Id,
      content: 'Pro tip for internships: Document everything you build! A well-written README with architecture diagrams and API specs will impress any engineering team.',
      image: '',
      likes: [u1Id, u4Id],
      createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 28 * 60 * 60 * 1000)
    },
    {
      _id: p5Id,
      author: u5Id,
      content: 'Always hash user passwords using bcrypt with a proper salt factor before persisting to your database. Never store or expose plain text passwords anywhere in your API payloads.',
      image: '',
      likes: [u1Id, u2Id, u3Id, u4Id],
      createdAt: new Date(Date.now() - 42 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 42 * 60 * 60 * 1000)
    },
    {
      _id: p6Id,
      author: u2Id,
      content: 'Late night coding session fueled by matcha latte. Working on the follower recommendation engine today! 🍵⚡️',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
      likes: [u1Id, u3Id],
      createdAt: new Date(Date.now() - 55 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 55 * 60 * 60 * 1000)
    }
  ];

  memoryStore.comments = [
    {
      _id: '66f003030303030303030001',
      post: p1Id,
      author: u2Id,
      text: 'Looks phenomenal Alex! The UI transitions are super smooth.',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      _id: '66f003030303030303030002',
      post: p1Id,
      author: u4Id,
      text: 'Great attention to detail on the typography and spacing! 🔥',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      _id: '66f003030303030303030003',
      post: p3Id,
      author: u1Id,
      text: '100% agreed! High contrast harsh white hurts the eyes after hours of browsing.',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      _id: '66f003030303030303030004',
      post: p5Id,
      author: u3Id,
      text: 'Crucial advice! Also ensure tokens have proper expiration times.',
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
    }
  ];

  memoryStore.isMemoryMode = true;
  console.log('✅ Connectly In-Memory Store initialized with 5 demo users, 6 posts, and comments.');
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️  No MONGODB_URI provided in environment. Utilizing high-fidelity in-memory database engine.');
    await seedMemoryStore();
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed (${error.message}). Falling back to in-memory database engine.`);
    await seedMemoryStore();
  }
};

export default connectDB;
