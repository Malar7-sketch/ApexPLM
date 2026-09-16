const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, local DNS sometimes fails to resolve SRV records (_mongodb._tcp) for MongoDB Atlas.
// Setting public DNS servers ensures reliable Atlas cluster resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      console.error('FATAL: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(connUri, {
      dbName: 'ApexPLM',
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB connected successfully [Database: ${conn.connection.name}]`);
    return conn;

  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

