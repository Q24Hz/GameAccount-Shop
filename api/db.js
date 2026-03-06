const { MongoClient } = require('mongodb');

// Sử dụng biến môi trường để bảo mật (trên Vercel)
const uri = process.env.MONGODB_URI || "mongodb+srv://qhung:<@>@cluster0.nzdkkdq.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    await client.connect();
    const db = client.db('shopgame');
    cachedDb = db;
    console.log('✅ Kết nối MongoDB thành công!');
    return db;
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };