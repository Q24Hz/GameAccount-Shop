const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  // Chỉ cho phép method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, amount, code, method } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!userId || !amount || !code) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  if (isNaN(userId) || isNaN(amount) || amount < 1000) {
    return res.status(400).json({ message: 'Số tiền không hợp lệ (tối thiểu 1.000đ)' });
  }

  try {
    const db = await connectToDatabase();
    const transactions = db.collection('transactions');

    // Kiểm tra code đã tồn tại chưa
    const existing = await transactions.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: 'Mã giao dịch đã tồn tại, vui lòng thử lại' });
    }

    const newTransaction = {
      id: Date.now(),
      userId: parseInt(userId),
      amount: parseInt(amount),
      code,
      method: method || 'vietqr',
      status: 'pending',
      createdAt: new Date()
    };

    await transactions.insertOne(newTransaction);
    
    res.status(201).json({ 
      success: true, 
      transactionId: newTransaction.id,
      message: 'Tạo lệnh nạp thành công! Vui lòng chuyển khoản và chờ admin duyệt.'
    });

  } catch (error) {
    console.error('Lỗi tạo lệnh nạp:', error);
    res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
  }
};