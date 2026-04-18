const express = require('express');
const ProductDAO = require('../dao/productDao');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await ProductDAO.getAllProducts();

    return res.status(200).json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    return res.status(500).json({
      message: 'Server error while fetching products.'
    });
  }
});

// GET /api/products/search
router.get('/search', async (req, res) => {
  const {keyword} = req.query; 
  try {
    const products = await ProductDAO.searchProducts(keyword);

    return res.status(200).json(products);
  } catch (error) {
    console.error('Filter products error:', error);
    return res.status(500).json({
      message: 'Server error while fetching products.'
    });
  }
});


// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        message: 'Invalid product id.'
      });
    }

    const product = await ProductDAO.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.'
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Get product by id error:', error);
    return res.status(500).json({
      message: 'Server error while fetching product.'
    });
  }
});




// GET /api/products/filter
router.get('/filter', async (req, res) => {
  const {keyword} = req.query; 

  const {category, publisher, brand} = req.query; 
  try {
    const products = await ProductDAO.filterProducts(category,publisher,brand);

    return res.status(200).json(products);
  } catch (error) {
    console.error('Filter products error:', error);
    return res.status(500).json({
      message: 'Server error while fetching products.'
    });
  }
});
// GET /api/products/sort/name
router.get('/sort/name', async (req, res) => {
  try {
    const {order} = req.query; 

    const products = await ProductDAO.sortProductsByTitle(order);

    return res.status(200).json(products);
  } catch (error) {
    console.error('Filter products error:', error);
    return res.status(500).json({
      message: 'Server error while fetching products.'
    });
  }
});
// GET /api/products/sort/price
router.get('/sort/price', async (req, res) => {
  const {order} = req.query; 

  try {
    
    const products = await ProductDAO.sortProductsByPrice(order);

    return res.status(200).json(products);
  } catch (error) {
    console.error('Filter products error:', error);
    return res.status(500).json({
      message: 'Server error while fetching products.'
    });
  }
});



module.exports = router;