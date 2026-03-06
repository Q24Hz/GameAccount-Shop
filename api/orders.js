const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const orders = db.collection('orders');
    const users = db.collection('users');
    const products = db.collection('products');

    // GET: Lấy danh sách đơn hàng
    if (req.method === 'GET') {
      const { userId, status } = req.query;
      let query = {};
      if (userId) query.userId = parseInt(userId);
      if (status) query.status = status;

      const result = await orders.find(query).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(result);
    }

    // POST: Tạo đơn hàng mới (thanh toán bằng số dư)
    if (req.method === 'POST') {
      const { userId, accountId, accountName, unitPrice, quantity, totalPrice, discountCode, buyerName, buyerPhone } = req.body;

      // Kiểm tra dữ liệu
      if (!userId || !accountId || !unitPrice || !quantity || !totalPrice || !buyerName) {
        return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
      }

      // Kiểm tra số dư
      const user = await users.findOne({ id: parseInt(userId) });
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user' });
      }

      if (user.balance < totalPrice) {
        return res.status(400).json({ message: 'Số dư không đủ' });
      }

      // Kiểm tra tài khoản game còn không
      const product = await products.findOne({ id: parseInt(accountId), status: 'available' });
      if (!product) {
        return res.status(400).json({ message: 'Tài khoản không còn khả dụng' });
      }

      // Trừ tiền
      const newBalance = user.balance - totalPrice;
      await users.updateOne(
        { id: parseInt(userId) },
        { $set: { balance: newBalance } }
      );

      // Đánh dấu tài khoản đã bán
      await products.updateOne(
        { id: parseInt(accountId) },
        { $set: { status: 'sold' } }
      );

      // Nếu có mã giảm giá, cập nhật số lần sử dụng
      if (discountCode && discountCode.trim() !== '') {
        const discounts = db.collection('discount_codes');
        await discounts.updateOne(
          { code: discountCode },
          { $inc: { usedCount: 1 } }
        );
      }

      // Tạo đơn hàng (trạng thái completed ngay)
      const newOrder = {
        id: Date.now(),
        userId: parseInt(userId),
        accountId: parseInt(accountId),
        accountName,
        unitPrice,
        quantity,
        totalPrice,
        discountCode: discountCode || null,
        buyerName,
        buyerPhone: buyerPhone || '',
        status: 'completed',
        accountInfo: {
          loginEmail: product.loginEmail,
          loginPassword: product.loginPassword
        },
        createdAt: new Date(),
        completedAt: new Date()
      };

      await orders.insertOne(newOrder);

      return res.status(201).json({
        success: true,
        order: newOrder,
        account: {
          email: product.loginEmail,
          password: product.loginPassword
        },
        newBalance
      });
    }

    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Lỗi xử lý đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};