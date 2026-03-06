const { connectToDatabase } = require('../../db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');
    const user = await users.findOne({ id: parseInt(userId) });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ balance: user.balance || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
