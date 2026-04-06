const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart')
const productRoutes = require('./routes/products')
const adminUserRoutes = require('./routes/adminUsers');
const userRoutes = require('./routes/users')

const app = express()

app.use(cors());
app.use(express.json());
app.use('/api/auth',authRoutes)
app.use('/api/products',productRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/admin/users',adminUserRoutes)
app.use('/api/users',userRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Bookstore API is running 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));