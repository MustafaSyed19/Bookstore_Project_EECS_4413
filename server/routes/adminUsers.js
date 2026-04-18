const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const UserDAO = require('../dao/userDao');
const AddressDAO = require('../dao/addressDao');
const OrderDAO = require('../dao/orderDao');
const OrderItemDAO = require('../dao/orderItemDao');

const router = express.Router();

// GET /api/admin/users
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await UserDAO.getAllUsers();
    return res.json(users);
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ message: 'Server error while fetching users.' });
  }
});

// PUT /api/admin/users/:id
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const existingUser = await UserDAO.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { email, firstName, lastName, role, address } = req.body;

    const updated = await UserDAO.updateUser(userId, {
      email: email ?? existingUser.email,
      passwordHash: existingUser.passwordHash,
      firstName: firstName ?? existingUser.firstName,
      lastName: lastName ?? existingUser.lastName,
      role: role ?? existingUser.role
    });

    if (!updated) {
      return res.status(400).json({ message: 'Failed to update user.' });
    }

    if (address) {
      const addresses = await AddressDAO.getAddressesByUserId(userId);

      if (addresses.length > 0) {
        await AddressDAO.updateAddress(addresses[0].id, {
          street: address.street ?? addresses[0].street,
          city: address.city ?? addresses[0].city,
          province: address.province ?? addresses[0].province,
          country: address.country ?? addresses[0].country,
          zip: address.zip ?? addresses[0].zip,
          phone: address.phone ?? addresses[0].phone,
          isDefault: address.isDefault ?? addresses[0].isDefault
        });
      } else {
        await AddressDAO.createAddress({
          userId,
          street: address.street || null,
          city: address.city || null,
          province: address.province || null,
          country: address.country || null,
          zip: address.zip || null,
          phone: address.phone || null,
          isDefault: address.isDefault ?? true
        });
      }
    }

    const user = await UserDAO.getUserById(userId);
    const updatedAddresses = await AddressDAO.getAddressesByUserId(userId);

    return res.json({
      message: 'User updated successfully.',
      user,
      addresses: updatedAddresses
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ message: 'Server error while updating user.' });
  }
});

// GET /api/admin/users/all — admin only
router.get('/all', /*verifyToken, requireAdmin,*/ async (req, res) => {
  try {
    const orders = await OrderDAO.getAllOrders();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const [items, user, address] = await Promise.all([
          OrderItemDAO.getOrderItemsByOrderId(order.id),
          UserDAO.getUserById(order.userId),
          order.shippingAddressId
            ? AddressDAO.getAddressById(order.shippingAddressId)
            : null,
        ]);

        return {
          ...order,
          items,
          shipping: address || null,
          userName: user ? `${user.firstName} ${user.lastName}`.trim() : '—',
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
});

module.exports = router;