const db = require('./db');

const ProductDAO = {
  async createProduct(product) {
    const sql = `
      INSERT INTO book
      (isbn, price, title, language, pages, description, category, publisher, brand, quantity, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      product.isbn || null,
      product.price,
      product.title,
      product.language,
      product.pages ?? 0,
      product.description || null,
      product.category || null,
      product.publisher || null,
      product.brand || null,
      product.quantity ?? 0,
      product.imageUrl || null
    ]);

    return result.insertId;
  },

  async getProductById(id) {
    const sql = `SELECT * FROM book WHERE id = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows[0] || null;
  },

  async getAllProducts() {
    const sql = `SELECT * FROM book`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async searchProducts(keyword) {
    const sql = `
      SELECT * FROM book
      WHERE title LIKE ?
         OR description LIKE ?
         OR category LIKE ?
         OR publisher LIKE ?
         OR brand LIKE ?
    `;
    const like = `%${keyword}%`;

    const [rows] = await db.execute(sql, [like, like, like, like, like]);
    return rows;
  },

  async filterProducts({ category, publisher, brand }) {
    let sql = `SELECT * FROM book WHERE 1=1`;
    const params = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (publisher) {
      sql += ` AND publisher = ?`;
      params.push(publisher);
    }

    if (brand) {
      sql += ` AND brand = ?`;
      params.push(brand);
    }

    const [rows] = await db.execute(sql, params);
    return rows;
  },

  async sortProductsByPrice(order = 'ASC') {
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const sql = `SELECT * FROM book ORDER BY price ${safeOrder}`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async sortProductsByTitle(order = 'ASC') {
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const sql = `SELECT * FROM book ORDER BY title ${safeOrder}`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async updateProduct(id, product) {
    const sql = `
      UPDATE book
      SET isbn = ?, price = ?, title = ?, language = ?, pages = ?, description = ?,
          category = ?, publisher = ?, brand = ?, quantity = ?, imageUrl = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [
      product.isbn || null,
      product.price,
      product.title,
      product.language,
      product.pages ?? 0,
      product.description || null,
      product.category || null,
      product.publisher || null,
      product.brand || null,
      product.quantity ?? 0,
      product.imageUrl || null,
      id
    ]);

    return result.affectedRows > 0;
  },

  async updateInventory(id, quantity) {
    const sql = `UPDATE book SET quantity = ? WHERE id = ?`;
    const [result] = await db.execute(sql, [quantity, id]);
    return result.affectedRows > 0;
  },

  async decreaseInventory(id, amount, conn = db) {
    const sql = `
      UPDATE book
      SET quantity = quantity - ?
      WHERE id = ? AND quantity >= ?
    `;
    const [result] = await conn.execute(sql, [amount, id, amount]);
    return result.affectedRows > 0;
  },

  async deleteProduct(id) {
    const sql = `DELETE FROM book WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = ProductDAO;