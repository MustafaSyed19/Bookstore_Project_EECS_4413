const db = require('./db');

const AddressDAO = {
  async createAddress(address) {
    const sql = `
      INSERT INTO address (userId, street, city, province, country, zip, phone, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      address.userId,
      address.street,
      address.city,
      address.province,
      address.country,
      address.zip,
      address.phone,
      address.isDefault || false
    ]);

    return result.insertId;
  },

  async getAddressById(id) {
    const sql = `SELECT * FROM address WHERE id = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows[0] || null;
  },

  async getAddressesByUserId(userId) {
    const sql = `SELECT * FROM address WHERE userId = ?`;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },

  async getDefaultAddressByUserId(userId) {
    const sql = `
      SELECT * FROM address
      WHERE userId = ? AND isDefault = TRUE
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows[0] || null;
  },

  async updateAddress(id, address) {
    const sql = `
      UPDATE address
      SET street = ?, city = ?, province = ?, country = ?, zip = ?, phone = ?, isDefault = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [
      address.street,
      address.city,
      address.province,
      address.country,
      address.zip,
      address.phone,
      address.isDefault,
      id
    ]);

    return result.affectedRows > 0;
  },

  async deleteAddress(id) {
    const sql = `DELETE FROM address WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = AddressDAO;