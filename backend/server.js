const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./utils/db');
const { ensureInitialUsers, seedDatabase } = require('./utils/seedData');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const bomRoutes = require('./routes/bomRoutes');
const documentRoutes = require('./routes/documentRoutes');
const ncrRoutes = require('./routes/ncrRoutes');
const auditRoutes = require('./routes/auditRoutes');
const partRoutes = require('./routes/partRoutes');

const app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive to allow Vercel previews & production domains
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and Root endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'ApexPLM Backend is Running',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ApexPLM API',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ncrs', ncrRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/parts', partRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Ensure initial system users exist for authentication bootstrap
    await ensureInitialUsers();

    // Ensure database collections (projects, BOM, documents, NCRs) exist
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`ApexPLM backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
