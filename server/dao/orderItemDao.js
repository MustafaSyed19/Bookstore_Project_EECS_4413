const db = require('./db');

const OrderItemDAO = {
  async createOrderItem({ orderId, bookId, quantity, priceAtPurchase },conn = db) {
    const sql = `
      INSERT INTO orderitem (orderId, bookId, quantity, priceAtPurchase)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await conn.execute(sql, [
      orderId,
      bookId,
      quantity,
      priceAtPurchase
    ]);

    return result.insertId;
  },

  async createManyOrderItems(orderItems) {
    const sql = `
      INSERT INTO orderitem (orderId, bookId, quantity, priceAtPurchase)
      VALUES ?
    `;

    const values = orderItems.map(item => [
      item.orderId,
      item.bookId,
      item.quantity,
      item.priceAtPurchase
    ]);

    const [result] = await db.query(sql, [values]);
    return result.affectedRows;
  },

  async getOrderItemsByOrderId(orderId) {
    const sql = `
      SELECT
        oi.id,
        oi.orderId,
        oi.bookId,
        oi.quantity,
        oi.priceAtPurchase,
        b.title,
        b.imageUrl
      FROM orderitem oi
      JOIN book b ON oi.bookId = b.id
      WHERE oi.orderId = ?
    `;

    const [rows] = await db.execute(sql, [orderId]);
    return rows;
  },

  async getAllOrderItems() {
    const sql = `
      SELECT
        oi.*,
        b.title
      FROM orderitem oi
      JOIN book b ON oi.bookId = b.id
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async deleteOrderItemsByOrderId(orderId) {
    const sql = `DELETE FROM orderitem WHERE orderId = ?`;
    const [result] = await db.execute(sql, [orderId]);
    return result.affectedRows >= 0;
  }
};

module.exports = OrderItemDAO;