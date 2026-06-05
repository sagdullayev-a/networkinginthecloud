import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  login,
  getProfile,
  updateProfile,
} from '../controllers/authController';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController';
import {
  getInventory,
  updateStock,
} from '../controllers/inventoryController';
import {
  getDashboardStats,
} from '../controllers/dashboardController';

const router = Router();

// PUBLIC ROUTES
router.post('/auth/login', login);

// PROTECTED ROUTES (Requires JWT)
router.use(authenticateToken as any); // cast middleware to satisfy Express type mapping if needed

// Auth/Profile
router.get('/auth/profile', getProfile);
router.put('/auth/profile', updateProfile);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Customers (CRM)
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Products (WMS Catalog)
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders (ERP Billing)
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.post('/orders', createOrder);
router.put('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);

// Inventory (WMS Stock)
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateStock);

export default router;
