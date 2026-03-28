const db = require("./db");

const CartDAO = {
  async getCartByUserId(userId) {
    const sql = `
      SELECT
        c.id,
        c.userId,
        c.bookId,
        c.quantity,
        b.title,
        b.price,
        b.imageUrl,
        b.quantity AS inventory
      FROM CartItem c
      JOIN BOOK b ON c.bookId = b.id
      WHERE c.userId = ?
    `;

    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },

  async getCartItemByUserAndBook(userId, bookId) {
    const sql = `
      SELECT * FROM CartItem
      WHERE userId = ? AND bookId = ?
    `;
    const [rows] = await db.execute(sql, [userId, bookId]);
    return rows[0] || null;
  },

  async addToCart(userId, bookId, quantity = 1) {
    const existing = await this.getCartItemByUserAndBook(userId, bookId);

    if (existing) {
      const sql = `
        UPDATE CartItem
        SET quantity = quantity + ?
        WHERE userId = ? AND bookId = ?
      `;
      const [result] = await db.execute(sql, [quantity, userId, bookId]);
      return result.affectedRows > 0;
    }

    const sql = `
      INSERT INTO CartItem (userId, bookId, quantity)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(sql, [userId, bookId, quantity]);
    return result.insertId;
  },

  async updateCartItemQuantity(userId, bookId, quantity) {
    const sql = `
      UPDATE CartItem
      SET quantity = ?
      WHERE userId = ? AND bookId = ?
    `;
    const [result] = await db.execute(sql, [quantity, userId, bookId]);
    return result.affectedRows > 0;
  },

  async removeFromCart(userId, bookId) {
    const sql = `
      DELETE FROM CartItem
      WHERE userId = ? AND bookId = ?
    `;
    const [result] = await db.execute(sql, [userId, bookId]);
    return result.affectedRows > 0;
  },

  async clearCart(userId) {
    const sql = `DELETE FROM CartItem WHERE userId = ?`;
    const [result] = await db.execute(sql, [userId]);
    return result.affectedRows >= 0;
  },

  async getCartTotal(userId) {
    const sql = `
      SELECT COALESCE(SUM(c.quantity * b.price), 0) AS total
      FROM CartItem c
      JOIN BOOK b ON c.bookId = b.id
      WHERE c.userId = ?
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows[0]?.total || 0;
  }
};

module.exports = CartDAO;