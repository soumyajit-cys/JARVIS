require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('./middleware/rateLimit');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session management for context memory
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 3600000 } // 1 hour
}));

// Apply rate limiting
app.use('/api/', rateLimit);

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'JARVIS AI is operational', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🦾 JARVIS Backend running on port ${PORT}`);
});

