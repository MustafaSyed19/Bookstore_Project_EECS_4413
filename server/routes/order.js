const express = require('express');
const router = express.Router();

const db = require('../dao/db');
const verifyToken = require('../middleware/verifyToken');

const OrderDAO = require('../dao/orderDao');
const OrderItemDAO = require('../dao/orderItemDao');
const ProductDAO = require('../dao/productDao');

router.post('/', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const {items, shippingAddressId = null } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must include items' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    const validatedItems = [];

    // 🔹 1. Validate inventory (still need raw query for FOR UPDATE)
    for (const item of items) {
      const bookId = Number(item.bookId);
      const qty = Number(item.quantity);

      const [rows] = await conn.execute(
        `SELECT id, title, price, quantity
         FROM book
         WHERE id = ?
         FOR UPDATE`,
        [bookId]
      );

      if (!rows.length) {
        throw new Error(`Book ${bookId} not found`);
      }

      const book = rows[0];

      if (book.quantity < qty) {
        throw new Error(`Insufficient stock for ${book.title}`);
      }

      totalAmount += book.price * qty;

      validatedItems.push({
        bookId,
        quantity: qty,
        priceAtPurchase: book.price
      });
    }

    // 🔹 2. Create order (DAO ✅)
    const orderId = await OrderDAO.createOrder(
      {
        userId,
        totalAmount,
        status: 'pending',
        shippingAddressId
      },
      conn
    );

    // 🔹 3. Create items + reduce inventory (DAO ✅)
    for (const item of validatedItems) {
      await OrderItemDAO.createOrderItem(
        {
          orderId,
          bookId: item.bookId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase
        },
        conn
      );

      const success = await ProductDAO.decreaseInventory(
        item.bookId,
        item.quantity,
        conn
      );

      if (!success) {
        throw new Error('Inventory update failed');
      }
    }

    await conn.commit();

    return res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalAmount
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);

    return res.status(400).json({
      message: err.message || 'Order failed'
    });
  } finally {
    conn.release();
  }
});

router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await OrderDAO.getOrdersByUserId(userId);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItemDAO.getOrderItemsByOrderId(order.id);
        return { ...order, items };
      })
    );

    return res.json(ordersWithItems);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  const orderId = req.params.id;

  if (!orderId) {
    return res.status(400).json({
      message: 'Order ID is required'
    });
  }

  try {
    const order = await OrderDAO.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // Optional: include items
    const items = await OrderItemDAO.getOrderItemsByOrderId(orderId);
    order.items = items;

    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Failed to fetch order'
    });
  }
});
module.exports = router;