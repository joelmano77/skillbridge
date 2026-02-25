# SkillBridge  live project: https://skillbridge-fpz3.onrender.com/

A comprehensive platform connecting skilled volunteers with NGOs for meaningful impact through skill-based volunteering.

## 🌟 Overview

SkillBridge bridges the gap between professionals seeking to make a difference and NGOs in need of specialized skills. Our platform enables volunteers to contribute their expertise in technology, marketing, design, and other fields while helping NGOs achieve their missions more effectively.

## ✨ Features

### For Volunteers
- **Profile Creation**: Showcase skills, experience, and interests
- **Opportunity Discovery**: Browse and apply for NGO opportunities
- **Smart Matching**: Get matched with opportunities based on skills and interests
- **Real-time Messaging**: Connect directly with NGOs
- **Application Tracking**: Monitor application status and history
- **Dashboard**: Overview of activities and opportunities

### For NGOs
- **Organization Profile**: Present mission, focus areas, and needs
- **Opportunity Posting**: Create detailed volunteer opportunities
- **Application Management**: Review and manage volunteer applications
- **Volunteer Discovery**: Find skilled volunteers for specific needs
- **Direct Communication**: Chat with potential volunteers
- **Dashboard**: Track opportunities and applications

### Platform Features
- **Real-time Notifications**: Stay updated on applications and messages
- **Secure Authentication**: JWT-based authentication with password reset
- **Email Notifications**: Automated emails for important events
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Search & Filters**: Advanced filtering for opportunities and users

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.io
- **WebSocket Client**: socket.io-client
- **Email Service**: Nodemailer
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time Communication**: socket.io-client
- **Icons**: Lucide React
- **State Management**: React Context API

### Development Tools
- **Linting**: ESLint
- **Code Formatting**: Prettier (via ESLint)
- **Process Management**: Nodemon (backend development)

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the Backend directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/skillbridge
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:5173
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running locally or update MONGODB_URI for Atlas.

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📖 Usage

### Getting Started
1. **Register**: Create an account as either a volunteer or NGO
2. **Complete Profile**: Fill in your details and preferences
3. **Explore**: Browse opportunities or post your needs
4. **Connect**: Apply for opportunities or review applications
5. **Communicate**: Use the messaging system to coordinate

### User Roles

#### Volunteer Workflow
1. Sign up and create a detailed profile with skills and interests
2. Browse available opportunities using filters
3. Apply for opportunities that match your expertise
4. Communicate with NGOs through the platform
5. Track application status and contribute to projects

#### NGO Workflow
1. Register your organization and provide details
2. Post opportunities with specific skill requirements
3. Review volunteer applications and profiles
4. Communicate with potential volunteers
5. Manage ongoing projects and collaborations

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/volunteers` - Get volunteers with filters
- `GET /api/users/ngos` - Get NGOs with filters
- `GET /api/users/discover` - Discover users for messaging
- `GET /api/users/profile/:userId` - Get detailed user profile

### Opportunities
- `GET /api/opportunities` - List opportunities with filters
- `GET /api/opportunities/:id` - Get specific opportunity
- `POST /api/opportunities` - Create new opportunity (NGO only)
- `PUT /api/opportunities/:id` - Update opportunity (NGO only)
- `DELETE /api/opportunities/:id` - Delete opportunity (NGO only)

### Applications
- `POST /api/applications` - Apply for opportunity (Volunteer only)
- `GET /api/applications` - Get applications for NGO's opportunities
- `GET /api/applications/my` - Get volunteer's applications
- `PUT /api/applications/:id` - Update application status (NGO only)
- `DELETE /api/applications/:id` - Withdraw application (Volunteer only)

### Messaging
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `PUT /api/messages/read/:senderId` - Mark messages as read
- `DELETE /api/messages/:messageId` - Delete message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/suggest-opportunity` - Suggest opportunity to volunteer

### Health Check
- `GET /api/health` - Server health and statistics

## 🔧 Development

### Available Scripts

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (not implemented yet)

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
SkillBridge_Group2/
├── Backend/
│   ├── models/          # MongoDB models
│   ├── src/
│   │   └── utils/       # Utility functions
│   ├── server.js        # Main server file
│   ├── package.json
│   └── ...
├── Frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── ...
└── README.md
```

## 🤝 Contributing

We welcome contributions to SkillBridge! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes and commit:** `git commit -m 'Add some feature'`
4. **Push to the branch:** `git push origin feature/your-feature-name`
5. **Open a Pull Request**

### Guidelines
- Follow the existing code style
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure all tests pass

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Contact

For questions, suggestions, or support, please reach out to the development team.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for meaningful volunteer-NGO connections
- Thanks to all contributors and the open-source community

---

**Made with ❤️ for social impact**
