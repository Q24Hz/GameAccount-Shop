const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { id, action = 'approve', note } = req.body; // Mặc định action = 'approve'
  if (!id) return res.status(400).json({ message: 'Missing id' });

  try {
    const db = await connectToDatabase();
    const transactions = db.collection('transactions');
    const users = db.collection('users');

    const transaction = await transactions.findOne({ id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    if (action === 'approve') {
      // Duyệt: cập nhật trạng thái và cộng tiền
      await transactions.updateOne(
        { id },
        { $set: { status: 'completed', completedAt: new Date(), note } }
      );
      await users.updateOne(
        { id: transaction.userId },
        { $inc: { balance: transaction.amount } }
      );
      return res.json({ success: true, message: 'Đã duyệt và cộng tiền' });
    } 
    else if (action === 'reject') {
      // Từ chối: chỉ cập nhật trạng thái
      await transactions.updateOne(
        { id },
        { $set: { status: 'rejected', completedAt: new Date(), note } }
      );
      return res.json({ success: true, message: 'Đã từ chối' });
    } 
    else {
      return res.status(400).json({ message: 'Invalid action' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};