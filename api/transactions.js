const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const db = await connectToDatabase();
    const transactions = db.collection('transactions');
    
    const result = await transactions
      .find({ userId: parseInt(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};