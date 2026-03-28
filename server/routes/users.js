const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const UserDAO = require('../dao/userDao');
const AddressDAO = require('../dao/addressDao');

const router = express.Router();

// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.id, 10);

    if (isNaN(requestedUserId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    // user can access self, admin can access anyone
    if (req.user.userId !== requestedUserId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const user = await UserDAO.getUserById(requestedUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const addresses = await AddressDAO.getAddressesByUserId(requestedUserId);

    return res.json({
      user,
      addresses
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error while fetching profile.' });
  }
});

// PUT /api/users/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.id, 10);

    if (isNaN(requestedUserId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    if (req.user.userId !== requestedUserId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const existingUser = await UserDAO.getUserById(requestedUserId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const {
      email,
      firstName,
      lastName,
      address
    } = req.body;

    const updated = await UserDAO.updateUser(requestedUserId, {
      email: email ?? existingUser.email,
      passwordHash: existingUser.passwordHash,
      firstName: firstName ?? existingUser.firstName,
      lastName: lastName ?? existingUser.lastName,
      role: existingUser.role
    });

    if (!updated) {
      return res.status(400).json({ message: 'Failed to update user.' });
    }

    if (address) {
      const existingAddresses = await AddressDAO.getAddressesByUserId(requestedUserId);

      if (existingAddresses.length > 0) {
        const firstAddress = existingAddresses[0];
        await AddressDAO.updateAddress(firstAddress.id, {
          street: address.street ?? firstAddress.street,
          city: address.city ?? firstAddress.city,
          province: address.province ?? firstAddress.province,
          country: address.country ?? firstAddress.country,
          zip: address.zip ?? firstAddress.zip,
          phone: address.phone ?? firstAddress.phone,
          isDefault: address.isDefault ?? firstAddress.isDefault
        });
      } else {
        await AddressDAO.createAddress({
          userId: requestedUserId,
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

    const user = await UserDAO.getUserById(requestedUserId);
    const addresses = await AddressDAO.getAddressesByUserId(requestedUserId);

    return res.json({
      message: 'Profile updated successfully.',
      user,
      addresses
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error while updating profile.' });
  }
});


module.exports = router;