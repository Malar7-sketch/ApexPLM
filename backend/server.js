const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./utils/db');
const { ensureInitialUsers } = require('./utils/seedData');
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

// CORS Configuration supporting all Vercel previews, custom domains, and localhost
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin', 'Cache-Control', 'Pragma'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 200,
  })
);

app.options('*', cors());

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

// Safe administrative dummy data cleanup endpoint
const { cleanConfirmedDummyData } = require('./utils/cleanDummyData');
app.post('/api/admin/clean-dummy-data', async (req, res, next) => {
  try {
    const summary = await cleanConfirmedDummyData();
    res.status(200).json({ success: true, message: 'Confirmed dummy data safely purged.', summary });
  } catch (err) {
    next(err);
  }
});

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

    // Note: Automatic database seeding disabled to ensure clean, user-driven data.
    // Seed scripts must only be run on explicit manual request in development.

    app.listen(PORT, () => {
      console.log(`ApexPLM backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
