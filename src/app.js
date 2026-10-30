const express = require('express');
const authRoutes = require('./routes/authRoutes');
const gradeRoutes = require('./routes/gradeRoutes');

const app = express();

// Body Parser Middleware
app.use(express.json());

// Root Healthcheck & Metadata Zero Trust
app.get('/', (req, res) => {
  res.json({
    application: 'Sintesys Academic Backend',
    architecture: 'Zero Trust Architecture (NIST SP 800-207)',
    status: 'OPERATIONAL',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        mockExpired: 'GET /api/auth/mock-expired-token'
      },
      grades: {
        viewCourseGrades: 'GET /api/grades/courses/:courseId',
        updateGrade: 'PUT /api/grades/courses/:courseId/students/:studentId'
      }
    },
    zeroTrustComponents: {
      PEP: 'Policy Enforcement Point (Data Plane Middleware)',
      PDP: 'Policy Decision Point (Control Plane Trust Algorithm Engine)',
      TokenPolicy: 'Short-Lived JWT (5 Minutes)'
    }
  });
});

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED_EXCEPTION]', err);
  res.status(500).json({
    status: 'ERROR',
    message: 'Internal Server Error'
  });
});

module.exports = app;
