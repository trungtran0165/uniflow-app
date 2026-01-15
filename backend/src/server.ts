import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to DAHK API',
    version: '1.0.0'
  });
});

// Import and use route modules
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import curriculumRouter from './routes/curriculum.js';
import registrationRouter from './routes/registration.js';
import adminProgramsRouter from './routes/admin/programs.js';
import adminClassesRouter from './routes/admin/classes.js';
import adminRegistrationWindowsRouter from './routes/admin/registration-windows.js';
import adminSemestersRouter from './routes/admin/semesters.js';
import adminRoomsRouter from './routes/admin/rooms.js';
import adminCoursesRouter from './routes/admin/courses.js';
import adminStudentsRouter from './routes/admin/students.js';
import lecturersRouter from './routes/lecturers.js';

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/registration', registrationRouter);
app.use('/api/admin/programs', adminProgramsRouter);
app.use('/api/admin/classes', adminClassesRouter);
app.use('/api/admin/registration-windows', adminRegistrationWindowsRouter);
app.use('/api/admin/semesters', adminSemestersRouter);
app.use('/api/admin/rooms', adminRoomsRouter);
app.use('/api/admin/courses', adminCoursesRouter);
app.use('/api/admin/students', adminStudentsRouter);
app.use('/api/lecturers', lecturersRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
