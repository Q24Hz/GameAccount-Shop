const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, amount } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ message: 'Missing userId or amount' });
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    const result = await users.updateOne(
      { id: parseInt(userId) },
      { $inc: { balance: amount } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await users.findOne({ id: parseInt(userId) });
    res.json({ success: true, newBalance: updatedUser.balance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
