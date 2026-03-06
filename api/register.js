const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');

    // Kiểm tra username đã tồn tại
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password, // Trong thực tế nên hash, nhưng tạm thời giữ nguyên
      balance: 0,
      role: 'user',
      createdAt: new Date()
    };

    await users.insertOne(newUser);

    const { password: _, ...userWithoutPass } = newUser;
    res.status(201).json(userWithoutPass);

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};