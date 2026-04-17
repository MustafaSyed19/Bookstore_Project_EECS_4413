const db = require('./db');

const UserDAO = {
  async createUser(user) {
    const sql = `
      INSERT INTO user (email, passwordHash, firstName, lastName, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      user.email,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.role || 'customer'
    ]);

    return result.insertId;
  },

  async getUserById(id) {
    const sql = `SELECT * FROM user WHERE id = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows[0] || null;
  },

  async getUserByEmail(email) {
    const sql = `SELECT * FROM user WHERE email = ?`;
    const [rows] = await db.execute(sql, [email]);
    return rows[0] || null;
  },

  async getAllUsers() {
    const sql = `SELECT * FROM user`;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async updateUser(id, user) {
    const sql = `
      UPDATE user
      SET email = ?, passwordHash = ?, firstName = ?, lastName = ?, role = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [
      user.email,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.role,
      id
    ]);

    return result.affectedRows > 0;
  },

  async deleteUser(id) {
    const sql = `DELETE FROM user WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = UserDAO;