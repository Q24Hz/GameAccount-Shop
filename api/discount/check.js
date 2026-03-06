const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, total } = req.query;
  if (!code) return res.json({ valid: false });

  try {
    const db = await connectToDatabase();
    const discounts = db.collection('discount_codes');
    const discount = await discounts.findOne({ code: code.toUpperCase() });

    if (!discount) {
      return res.json({ valid: false });
    }

    // Kiểm tra hạn sử dụng
    const now = new Date();
    if (discount.expiry && new Date(discount.expiry) < now) {
      return res.json({ valid: false, reason: 'expired' });
    }

    // Kiểm tra số lần sử dụng
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return res.json({ valid: false, reason: 'used up' });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    const totalNum = parseFloat(total) || 0;
    if (discount.minOrder && totalNum < discount.minOrder) {
      return res.json({ valid: false, reason: 'min order' });
    }

    res.json({
      valid: true,
      type: discount.type, // 'percent' hoặc 'fixed'
      value: discount.value,
      code: discount.code
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};