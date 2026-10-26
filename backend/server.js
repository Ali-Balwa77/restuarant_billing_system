import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import kotRoutes from './routes/kotRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import banquetRoutes from './routes/banquetRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import stewardRoutes from './routes/stewardRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import db from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/kots', kotRoutes);
app.use('/api/sales', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/banquet', banquetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stewards', stewardRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Restaurant POS Backend API',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🍽️ Restaurant POS API Running on Port ${PORT}`);
  console.log(`=================================================`);
});
