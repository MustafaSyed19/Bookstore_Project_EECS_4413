const db = require('./db');

const OrderDAO = {
  async createOrder({ userId, totalAmount, status = 'pending', shippingAddressId = null }, conn = db) {
    const sql = `
      INSERT INTO orders (userId, totalAmount, status, shippingAddressId)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await conn.execute(sql, [
      userId,
      totalAmount,
      status,
      shippingAddressId
    ]);

    return result.insertId;
  },

  async getOrderById(id) {
    const sql = `SELECT * FROM orders WHERE id = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows[0] || null;
  },

  async getOrdersByUserId(userId) {
    const sql = `
      SELECT *
      FROM orders
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },

  async getAllOrders() {
    const sql = `SELECT * FROM orders ORDER BY createdAt DESC`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async updateOrderStatus(id, status) {
    const sql = `
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(sql, [status, id]);
    return result.affectedRows > 0;
  },

  async getSalesByDateRange(startDate, endDate) {
    const sql = `
      SELECT *
      FROM orders
      WHERE createdAt BETWEEN ? AND ?
      ORDER BY createdAt DESC
    `;
    const [rows] = await db.execute(sql, [startDate, endDate]);
    return rows;
  },

  async deleteOrder(id) {
    const sql = `DELETE FROM orders WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = OrderDAO;