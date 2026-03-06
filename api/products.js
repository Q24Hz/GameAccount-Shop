const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const products = db.collection('products');

    const { game, status } = req.query;
    let query = {};
    if (game) query.game = game;
    if (status) query.status = status;
    else query.status = 'available'; // Mặc định lấy tài khoản còn bán

    const result = await products.find(query).sort({ createdAt: -1 }).toArray();
    res.status(200).json(result);

  } catch (error) {
    console.error('Lỗi lấy sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};