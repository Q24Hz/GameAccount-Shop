const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { game, title, rank, details, price, oldPrice, loginEmail, loginPassword, images } = req.body;

  // Kiểm tra dữ liệu bắt buộc
  if (!game || !title || !price || !loginEmail || !loginPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    const db = await connectToDatabase();
    const products = db.collection('products');

    // Kiểm tra trùng email đăng nhập (nếu cần)
    const existing = await products.findOne({ loginEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email đăng nhập đã tồn tại trong hệ thống' });
    }

    const priceNum = parseInt(price, 10);
    const oldPriceNum = oldPrice ? parseInt(oldPrice, 10) : null;

    // Kiểm tra oldPrice > price (nếu có)
    if (oldPriceNum && oldPriceNum <= priceNum) {
      return res.status(400).json({ message: 'Giá cũ phải lớn hơn giá mới' });
    }

    // Tạo tài khoản mới
    const newAccount = {
      id: Date.now() + Math.floor(Math.random() * 1000), // Tránh trùng id
      game,
      title,
      rank: rank || '',
      details: details || '',
      price: priceNum,
      oldPrice: oldPriceNum,
      loginEmail,
      loginPassword,
      images: images ? images.split(',').map(s => s.trim()).filter(s => s) : ['https://via.placeholder.com/200'],
      status: 'available',
      createdAt: new Date()
    };

    await products.insertOne(newAccount);
    
    res.status(201).json({ 
      success: true, 
      message: 'Thêm tài khoản thành công!',
      account: newAccount 
    });

  } catch (error) {
    console.error('Lỗi thêm tài khoản:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};