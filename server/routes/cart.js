const express = require('express');
const CartDAO = require('../dao/cartDao');
const ProductDAO = require('../dao/productDao');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// GET /api/cart
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cartItems = await CartDAO.getCartByUserId(userId);
    const total = await CartDAO.getCartTotal(userId);

    return res.status(200).json({
      items: cartItems,
      total
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      message: 'Server error while fetching cart.'
    });
  }
});

// POST /api/cart/add
router.post('/add', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, quantity } = req.body;

    if (!bookId) {
      return res.status(400).json({
        message: 'bookId is required.'
      });
    }

    const parsedBookId = parseInt(bookId, 10);
    const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;

    if (isNaN(parsedBookId) || parsedBookId <= 0) {
      return res.status(400).json({
        message: 'Invalid bookId.'
      });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        message: 'Quantity must be greater than 0.'
      });
    }

    const product = await ProductDAO.getProductById(parsedBookId);

    if (!product) {
      return res.status(404).json({
        message: 'Book not found.'
      });
    }

    if (product.quantity < parsedQuantity) {
      return res.status(400).json({
        message: 'Not enough inventory available.'
      });
    }

    await CartDAO.addToCart(userId, parsedBookId, parsedQuantity);

    const updatedCart = await CartDAO.getCartByUserId(userId);
    const total = await CartDAO.getCartTotal(userId);

    return res.status(200).json({
      message: 'Item added to cart successfully.',
      items: updatedCart,
      total
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      message: 'Server error while adding item to cart.'
    });
  }
});

// POST /api/cart/update
router.post('/update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, quantity } = req.body;

    if (!bookId) {
      return res.status(400).json({
        message: 'bookId is required.'
      });
    }

    const parsedBookId = parseInt(bookId, 10);
    const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;

    if (isNaN(parsedBookId) || parsedBookId <= 0) {
      return res.status(400).json({
        message: 'Invalid bookId.'
      });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        message: 'Quantity must be greater than 0.'
      });
    }

    const product = await ProductDAO.getProductById(parsedBookId);

    if (!product) {
      return res.status(404).json({
        message: 'Book not found.'
      });
    }

    if (product.quantity < parsedQuantity) {
      return res.status(400).json({
        message: 'Not enough inventory available.'
      });
    }

    await CartDAO.updateCartItemQuantity(userId, parsedBookId, parsedQuantity);

    const updatedCart = await CartDAO.getCartByUserId(userId);
    const total = await CartDAO.getCartTotal(userId);

    return res.status(200).json({
      message: 'Cart item updated successfully.',
      items: updatedCart,
      total
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({
      message: 'Server error while updating cart item.'
    });
  }
});

// POST /api/cart/delete
router.post('/delete', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        message: 'bookId is required.'
      });
    }

    const parsedBookId = parseInt(bookId, 10);

    if (isNaN(parsedBookId) || parsedBookId <= 0) {
      return res.status(400).json({
        message: 'Invalid bookId.'
      });
    }

    const product = await ProductDAO.getProductById(parsedBookId);

    if (!product) {
      return res.status(404).json({
        message: 'Book not found.'
      });
    }

    await CartDAO.removeFromCart(userId, parsedBookId);

    const updatedCart = await CartDAO.getCartByUserId(userId);
    const total = await CartDAO.getCartTotal(userId);

    return res.status(200).json({
      message: 'Item removed from cart successfully.',
      items: updatedCart,
      total
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return res.status(500).json({
      message: 'Server error while removing item from cart.'
    });
  }
});

// POST /api/cart/clear
router.post('/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await CartDAO.clearCart(userId);

    const updatedCart = await CartDAO.getCartByUserId(userId);
    const total = await CartDAO.getCartTotal(userId);

    return res.status(200).json({
      message: 'Cart cleared successfully.',
      items: updatedCart,
      total
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      message: 'Server error while clearing cart.'
    });
  }
});

module.exports = router;