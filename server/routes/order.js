const express = require('express');

const router = express.Router();

// POST /api/orders - Create a new order and reduce inventory
router.post('/', async (req, res) => {
    try {
        const { items, customerId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        // TODO: Implement order creation logic
        // 1. Validate inventory for all items
        // 2. Create order record in database
        // 3. Reduce inventory for each item
        // 4. Return order confirmation

        res.status(201).json({ message: 'Order created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;