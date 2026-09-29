# Connectly — Mini Social Media Platform

Connectly is a full-featured, responsive, and production-grade mini social media web application developed as an internship project. It is architected with a decoupled RESTful Express backend, MongoDB/Mongoose data models, JSON Web Token (JWT) authentication with bcrypt password hashing, and a vanilla JavaScript (ES6+), HTML5, and modern CSS frontend.

---

## 🌟 Features

### 1. Authentication & Security
- **User Registration**: Secure account creation with full name, unique username, email validation, and minimum 6-character password with confirmation match.
- **JWT Authentication**: Stateless authentication utilizing JSON Web Tokens stored in client local storage with automatic request header attachment (`Authorization: Bearer <token>`).
- **Password Hashing**: Industry-standard password hashing using `bcryptjs` with auto-generated salt rounds.
- **Route Protection**: Protected API routes via express authentication middleware and frontend client-side route guards.
- **Security Headers**: Production-ready HTTP security headers configured with `helmet` and custom CORS policies.

### 2. User Profiles
- **Profile Customization**: Users can edit their display name, bio (up to 160 characters), and custom avatar URL.
- **Automatic Avatar Fallbacks**: Beautiful SVG avatar generation using DiceBear initials when an avatar is not provided or fails to load.
- **Profile Metrics**: Real-time counts for Posts, Followers, and Following.
- **Multi-Tab Profile Navigation**: Interactive tabs for **Posts**, **Followers**, and **Following** lists with follow/unfollow capability.
- **Own vs. Public Profile Detection**: Displays "Edit Profile" on the user's own profile and "Follow / Following" on other profiles.

### 3. Posts & Feed
- **Rich Post Creation**: Text post composer with live character counter (500 max characters) and optional image attachment URL with live preview.
- **Dual Feed Modes**:
  - **Discover Feed**: Browse all community posts from newest to oldest.
  - **Following Feed**: Personalized feed showing only posts published by users you follow.
- **Pagination & Load More**: Paginated post retrieval with dynamic "Load More" controls.
- **Ownership Controls**: Post creators can delete their own posts; unauthorized deletion attempts are rejected with HTTP 403 Forbidden.

### 4. Likes & Comments
- **Interactive Like System**: Optimistic instant UI updates when liking and unliking posts, with idempotent database tracking.
- **Comment Threads**: Embedded comment drawers under each post and dedicated thread view (`post.html`).
- **Comment Authorization**: Comments can be deleted by either the author of the comment or the author of the parent post.
- **Relative Timestamps**: Dynamic human-readable timestamps ("Just now", "5m ago", "2h ago", "3d ago").

### 5. Follow System & User Discovery
- **Follow / Unfollow Engine**: Follow and unfollow users with instant bidirectional updates to follower and following counts.
- **Self-Follow Prevention**: Strict server and client validation preventing users from following themselves.
- **Instant Search**: Real-time debounced global search input matching both usernames and full names with an interactive dropdown.
- **Who to Follow Widget**: Curated suggestions on the sidebar to discover other creators.

### 6. UI / UX Design & Accessibility
- **Modern 3-Column Layout**: Left navigation and mini-profile, Center feed, Right recommendations.
- **Dark Mode / Light Mode**: Seamless theme switcher persisted in `localStorage`.
- **Toast Notifications**: Animated toast notification toasts for instant user feedback.
- **Confirmation Modals**: Accessible modal dialogs for confirming post and comment deletions.
- **Fully Responsive**: Adapts across Mobile (with bottom navigation bar), Tablet, and Desktop viewports.
- **Zero-Setup In-Memory Fallback**: Built-in mock database engine that automatically activates if a MongoDB daemon is not running, ensuring instant evaluation capability.

---

## 🛠 Tech Stack

### Frontend
- **HTML5**: Semantic markup, accessible attributes, and clean structure.
- **CSS3**: Modern CSS Variables, Flexbox, Grid, rounded corners, subtle elevations, and dark/light themes.
- **Vanilla JavaScript (ES6+)**: Fetch API, async/await, modular architecture (`api.js`, `auth.js`, `feed.js`, `profile.js`, `posts.js`, `main.js`), no heavy frontend frameworks.

### Backend
- **Node.js & Express.js**: RESTful API architecture with MVC structure (Routes, Controllers, Models, Middleware).
- **JSON Web Tokens (jsonwebtoken)**: Secure token creation, signature verification, and expiration handling.
- **bcryptjs**: Salt generation and password encryption.
- **Helmet & CORS**: Hardened HTTP headers and cross-origin resource sharing.

### Database
- **MongoDB & Mongoose ODM**: Object modeling with schemas, indexes, and document relationships.
- **Universal Repository Layer**: Supports both live MongoDB connections and a high-fidelity in-memory database with pre-seeded demo accounts.

---

## 📁 Project Structure

```text
social-media-platform/
│
├── frontend/
│   ├── index.html            # Main home feed with 3-column layout
│   ├── login.html            # User login with 1-click demo accounts
│   ├── register.html         # User registration with form validation
│   ├── profile.html          # User profile, follow/unfollow, and edit modal
│   ├── create-post.html      # Dedicated post composer
│   ├── post.html             # Single post view with full comment thread
│   ├── css/
│   │   └── style.css         # Complete design system & responsive styling
│   └── js/
│       ├── api.js            # Centralized Fetch API client with JWT handling
│       ├── auth.js           # Authentication helpers and route guards
│       ├── feed.js           # Feed rendering, filter tabs, and suggested users
│       ├── profile.js        # User profile, follower lists, and edit modal
│       ├── posts.js          # Post card template, like, and comment handlers
│       └── main.js           # Search dropdown, dark mode, and toast notifications
│
├── backend/
│   ├── server.js             # Standalone Express server entry point
│   ├── seed.js               # Database seed script with 5 users, posts & comments
│   ├── config/
│   │   └── db.js             # MongoDB connection & in-memory engine fallback
│   ├── models/
│   │   ├── User.js           # User schema & database operations
│   │   ├── Post.js           # Post schema & feed queries
│   │   └── Comment.js        # Comment schema & relations
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth routes
│   │   ├── userRoutes.js     # /api/users routes
│   │   ├── postRoutes.js     # /api/posts routes
│   │   └── commentRoutes.js  # /api/comments routes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   └── commentController.js
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT verification & optional auth
│   │   └── errorMiddleware.js# Centralized error & 404 handler
│   ├── .env                  # Local environment file
│   ├── .env.example          # Environment variable template
│   └── package.json          # Backend npm configuration
│
├── server.ts                 # Full-stack dev runner for preview environments
├── README.md                 # Project documentation
└── .gitignore                # Git ignore rules
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Port
PORT=5000

# Environment Mode
NODE_ENV=development

# MongoDB Connection String (Leave empty to use zero-setup in-memory database)
MONGODB_URI=mongodb://localhost:27017/connectly

# JWT Authentication Secrets
JWT_SECRET=connectly_super_secure_jwt_secret_internship_2026
JWT_EXPIRE=30d
```

---

## 🚀 Running Locally

### Option 1: Full-Stack Runner (Single Command)
In the project root:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Running Standalone Backend & Frontend
#### 1. Backend:
```bash
cd backend
npm install
npm run dev
```
The Express API will start on [http://localhost:5000](http://localhost:5000).

#### 2. Seed Database (Optional):
```bash
cd backend
npm run seed
```

#### 3. Frontend:
Serve the `frontend/` directory with any static file server:
```bash
# Using Python
cd frontend
python3 -m http.server 8080

# Or using npx serve
npx serve frontend
```

---

## 📑 API Documentation

### Auth Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |

### User Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users/search?q={query}` | Search users by name/username | Public |
| `GET` | `/api/users/suggested` | Get suggested users to follow | Public |
| `GET` | `/api/users/:id` | Get user profile by ID or username | Public |
| `PUT` | `/api/users/:id` | Update profile (name, bio, avatar) | Private (Self) |
| `POST` | `/api/users/:id/follow` | Follow a user | Private |
| `DELETE` | `/api/users/:id/follow` | Unfollow a user | Private |
| `GET` | `/api/users/:id/followers` | Get user's followers list | Public |
| `GET` | `/api/users/:id/following` | Get user's following list | Public |

### Post Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/posts` | Create a new post | Private |
| `GET` | `/api/posts?feed=all\|following&page=1` | Get paginated posts | Public |
| `GET` | `/api/posts/:id` | Get single post details | Public |
| `DELETE` | `/api/posts/:id` | Delete post | Private (Owner) |
| `POST` | `/api/posts/:id/like` | Like a post | Private |
| `DELETE` | `/api/posts/:id/like` | Unlike a post | Private |

### Comment Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/posts/:postId/comments` | Add comment to post | Private |
| `GET` | `/api/posts/:postId/comments` | Get all comments for post | Public |
| `DELETE` | `/api/comments/:id` | Delete comment | Private (Author/Post Owner) |

### System & Testing Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Health check endpoint | Public |
| `POST` | `/api/seed` | Reseed demo dataset | Public |

---

## 📸 Screenshots

| Desktop Feed View | Dark Mode View |
|---|---|
| ![Feed Screenshot Placeholder](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80) | ![Dark Mode Placeholder](https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80) |

| User Profile View | Mobile Feed View |
|---|---|
| ![Profile View Placeholder](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80) | ![Mobile View Placeholder](https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80) |

---

## 🔮 Future Improvements

1. **Real-Time WebSockets**: Live messaging and instant direct chat using Socket.io.
2. **Push Notifications**: Real-time alerts when someone likes your post, comments, or follows you.
3. **Cloudinary Media Upload**: Direct multipart file uploads for high-resolution post photos and avatars.
4. **Stories & Ephemeral Updates**: 24-hour disappearing video and photo stories.
5. **Hashtags & Trends**: Auto-detection of `#hashtags` with clickable discovery feeds.
6. **Bookmarks**: Saved posts library for reading later.

---

## 👨‍💻 Internship Submission Verification

1. **Pre-Seeded Test Accounts**:
   - `alex@connectly.app` / `password123`
   - `sophia@connectly.app` / `password123`
   - `marcus@connectly.app` / `password123`
   - `elena@connectly.app` / `password123`
   - `david@connectly.app` / `password123`
   - (Or use the 1-click quick login buttons on the login screen!)
2. **Resetting Demo Data**: Click the **Reset Demo Data** button in the left sidebar at any time.

---

## 📄 License
This project is open-source under the MIT License. Developed for software engineering internship evaluation.
