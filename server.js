require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const ensureAdminUser = require('./utils/ensureAdminUser');
const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskDetailRoutes = require('./routes/taskDetailRoutes');
const timeEntryDetailRoutes = require('./routes/timeEntryDetailRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Only connect + listen when not under test (tests manage their own DB)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    ensureAdminUser().catch((error) => {
      console.error('Failed to ensure admin user:', error.message);
    });
  });
}

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskDetailRoutes); 
app.use('/api/time-entries', timeEntryDetailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
