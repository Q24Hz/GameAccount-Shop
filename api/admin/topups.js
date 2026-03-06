const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const transactions = db.collection('transactions');
    const users = db.collection('users');
    
    const topups = await transactions.find({}).sort({ createdAt: -1 }).toArray();
    
    // Ghép tên user
    const result = [];
    for (let t of topups) {
      const user = await users.findOne({ id: t.userId });
      result.push({
        ...t,
        username: user ? user.username : 'Unknown'
      });
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};