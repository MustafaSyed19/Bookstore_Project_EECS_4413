const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserDAO = require('../dao/userDao');
require('dotenv').config();


const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await UserDAO.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'Email is already registered.'
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await UserDAO.createUser({
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      role: 'customer'
    });

    const user = await UserDAO.getUserById(userId);

    return res.status(201).json({
      message: 'User registered successfully.',
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      message: 'Server error during registration.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const user = await UserDAO.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Server error during login.'
    });
  }
});

module.exports = router;