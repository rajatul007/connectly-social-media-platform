# Connectly — Mini Social Media Platform

Connectly is a full-stack mini social media platform developed as an internship project. It allows users to create accounts, manage profiles, publish posts, interact with posts through likes and comments, follow other users, and discover content through search and personalized feeds.

## Features

### Authentication

* User registration and login
* JWT-based authentication
* Password hashing with bcryptjs
* Protected API routes
* Authentication-aware frontend navigation

### User Profiles

* View and edit user profiles
* Update display name, bio, and avatar
* View posts, followers, and following
* Follow and unfollow users
* Prevent users from following themselves

### Posts & Feed

* Create text posts
* Optional image URL for posts
* 500-character post limit
* Discover feed for community posts
* Following feed for followed users
* Pagination and load-more functionality
* Post ownership and deletion controls

### Likes & Comments

* Like and unlike posts
* Add comments to posts
* View complete comment threads
* Comment deletion with authorization
* Relative post and comment timestamps

### User Discovery

* Search users by name or username
* Suggested users to follow
* Follow/unfollow functionality
* Dynamic follower and following counts

### UI & UX

* Responsive desktop, tablet, and mobile layouts
* Light and dark themes
* Toast notifications
* Confirmation dialogs
* Mobile-friendly navigation

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Fetch API
* Responsive CSS
* Local Storage

### Backend

* Node.js
* Express.js
* REST API
* JSON Web Token (JWT)
* bcryptjs
* Helmet
* CORS

### Database

* MongoDB
* Mongoose

## Project Structure

```text
connectly-social-media-platform/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── create-post.html
│   ├── post.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── feed.js
│       ├── profile.js
│       ├── posts.js
│       └── main.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   └── commentRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   └── commentController.js
│   └── middleware/
│       ├── authMiddleware.js
│       └── errorMiddleware.js
│
├── server.ts
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Environment Variables

Create a `.env` file locally.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**Do not commit your `.env` file or real credentials to GitHub.**

## Installation

Clone the repository:

```bash
git clone https://github.com/rajatul007/connectly-social-media-platform.git
```

Open the project directory:

```bash
cd connectly-social-media-platform
```

Install dependencies:

```bash
npm install
```

Create your `.env` file using `.env.example` as a reference.

Start the development server:

```bash
npm run dev
```

The application will run at:

```text
http://localhost:3000
```

## API Overview

### Authentication

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/register` | Register a new user    |
| POST   | `/api/auth/login`    | Login and receive JWT  |
| GET    | `/api/auth/me`       | Get authenticated user |

### Users

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| GET    | `/api/users/search`        | Search users        |
| GET    | `/api/users/suggested`     | Get suggested users |
| GET    | `/api/users/:id`           | Get user profile    |
| PUT    | `/api/users/:id`           | Update profile      |
| POST   | `/api/users/:id/follow`    | Follow a user       |
| DELETE | `/api/users/:id/follow`    | Unfollow a user     |
| GET    | `/api/users/:id/followers` | Get followers       |
| GET    | `/api/users/:id/following` | Get following       |

### Posts

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| POST   | `/api/posts`          | Create a post     |
| GET    | `/api/posts`          | Get posts         |
| GET    | `/api/posts/:id`      | Get a single post |
| DELETE | `/api/posts/:id`      | Delete a post     |
| POST   | `/api/posts/:id/like` | Like a post       |
| DELETE | `/api/posts/:id/like` | Unlike a post     |

### Comments

| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| POST   | `/api/posts/:postId/comments` | Add a comment    |
| GET    | `/api/posts/:postId/comments` | Get comments     |
| DELETE | `/api/comments/:id`           | Delete a comment |

### Health Check

```text
GET /api/health
```

Used to verify that the backend server is running.

## Security

The project includes:

* JWT authentication
* Password hashing with bcryptjs
* Protected API routes
* Helmet security headers
* CORS configuration
* Environment variables for sensitive configuration
* Authorization checks for posts, comments, and user actions

## Future Improvements

* Real-time messaging
* Push notifications
* Cloud-based image uploads
* Stories
* Hashtags and trending topics
* Saved/bookmarked posts
* Real-time activity notifications

## Internship Project

Connectly was developed as a practical full-stack internship project to demonstrate:

* Frontend development
* REST API development
* Authentication and authorization
* Database integration
* CRUD operations
* Responsive UI development
* Git and GitHub workflow


