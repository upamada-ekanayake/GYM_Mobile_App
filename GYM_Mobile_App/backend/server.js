const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

// Initialize Firebase Admin SDK
require('./config/firebase');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// User Routes
app.use('/api/user', require('./routes/UserRoutes'));
app.use('/api/admin', require('./routes/AdminRoutes'));
app.use('/api/gym', require('./routes/GymRoutes'));
app.use('/api/coach', require('./routes/CoachRoutes'));
app.use('/api/admin-manage', require('./routes/AdminManageRoutes'));
app.use('/api/workouts', require('./routes/WorkoutsRoutes'));
app.use('/api/coachposts', require('./routes/CoachPostRoutes'));
app.use('/api/gym-posts', require('./routes/GymPostRoutes'));
app.use('/api/supplements', require('./routes/SupplementPostRoutes'));
app.use('/api/review', require('./routes/ReviewAndRatingRoutes'));
app.use('/api/ai-Model', require('./routes/AIModelRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
