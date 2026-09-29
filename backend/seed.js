// backend/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from './models/User.js';
import { PostModel } from './models/Post.js';
import { CommentModel } from './models/Comment.js';
import { seedMemoryStore } from './config/db.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('No MONGODB_URI set. Seeding in-memory store instead...');
      await seedMemoryStore();
      return true;
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
    await CommentModel.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    console.log('Creating demo users...');
    const users = await UserModel.create([
      {
        name: 'Alex Rivera',
        username: 'alexrivera',
        email: 'alex@connectly.app',
        password,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Full-stack developer & UI designer. Building scalable web apps and crafting clean digital experiences. 🚀'
      },
      {
        name: 'Sophia Chen',
        username: 'sophiacodes',
        email: 'sophia@connectly.app',
        password,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Software Engineering Intern @ TechCorp | Distributed systems enthusiast | Coffee lover ☕️'
      },
      {
        name: 'Marcus Vance',
        username: 'marcus_v',
        email: 'marcus@connectly.app',
        password,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Cloud Architect & Open Source contributor. Writing about Node.js, microservices, and databases.'
      },
      {
        name: 'Elena Rostova',
        username: 'elenadesigns',
        email: 'elena@connectly.app',
        password,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        bio: 'Product Designer obsessed with micro-interactions, accessibility, and minimalist typography. ✨'
      },
      {
        name: 'David Kim',
        username: 'david_k',
        email: 'david@connectly.app',
        password,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'DevOps & security researcher. Passionate about automated CI/CD and secure coding standards.'
      }
    ]);

    // Establish follow relationships
    users[0].followers.push(users[1]._id, users[2]._id, users[3]._id);
    users[0].following.push(users[1]._id, users[3]._id);

    users[1].followers.push(users[0]._id, users[2]._id);
    users[1].following.push(users[0]._id, users[2]._id, users[4]._id);

    users[2].followers.push(users[1]._id, users[3]._id, users[4]._id);
    users[2].following.push(users[0]._id, users[1]._id);

    users[3].followers.push(users[0]._id);
    users[3].following.push(users[0]._id, users[1]._id, users[2]._id);

    users[4].followers.push(users[1]._id);
    users[4].following.push(users[1]._id, users[2]._id);

    for (const u of users) {
      await u.save();
    }

    console.log('Creating demo posts...');
    const posts = await PostModel.create([
      {
        author: users[0]._id,
        content: 'Excited to launch Connectly today! Built with a clean RESTful Express backend, modular vanilla JavaScript, and modern CSS. Feels great when everything clicks into place.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        likes: [users[1]._id, users[2]._id, users[3]._id]
      },
      {
        author: users[1]._id,
        content: 'Finished reading through standard API design patterns. Key takeaway: consistent JSON responses with clear HTTP status codes make frontend integration a breeze! 💻',
        image: '',
        likes: [users[0]._id, users[2]._id]
      },
      {
        author: users[3]._id,
        content: 'Dark mode typography tip: Never use pure #FFFFFF on pure #000000. Use subtle off-whites like #F1F5F9 over rich deep slates like #0F172A to reduce visual fatigue.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80',
        likes: [users[0]._id, users[1]._id, users[4]._id]
      },
      {
        author: users[2]._id,
        content: 'Pro tip for internships: Document everything you build! A well-written README with architecture diagrams and API specs will impress any engineering team.',
        image: '',
        likes: [users[0]._id, users[3]._id]
      },
      {
        author: users[4]._id,
        content: 'Always hash user passwords using bcrypt with a proper salt factor before persisting to your database. Never store or expose plain text passwords anywhere in your API payloads.',
        image: '',
        likes: [users[0]._id, users[1]._id, users[2]._id, users[3]._id]
      },
      {
        author: users[1]._id,
        content: 'Late night coding session fueled by matcha latte. Working on the follower recommendation engine today! 🍵⚡️',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
        likes: [users[0]._id, users[2]._id]
      }
    ]);

    console.log('Creating demo comments...');
    await CommentModel.create([
      {
        post: posts[0]._id,
        author: users[1]._id,
        text: 'Looks phenomenal Alex! The UI transitions are super smooth.'
      },
      {
        post: posts[0]._id,
        author: users[3]._id,
        text: 'Great attention to detail on the typography and spacing! 🔥'
      },
      {
        post: posts[2]._id,
        author: users[0]._id,
        text: '100% agreed! High contrast harsh white hurts the eyes after hours of browsing.'
      },
      {
        post: posts[4]._id,
        author: users[2]._id,
        text: 'Crucial advice! Also ensure tokens have proper expiration times.'
      }
    ]);

    console.log('✅ Demo database seeded successfully!');
    return true;
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  }
};

// Run directly if called as main module
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
