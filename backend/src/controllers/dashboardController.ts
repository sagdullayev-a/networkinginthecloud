import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const totalCustomers = await prisma.customer.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const inventoryStats = await prisma.inventory.aggregate({
      _sum: {
        stockQuantity: true,
      },
    });
    const totalInventory = inventoryStats._sum.stockQuantity || 0;

    // Calculate revenue (excluding cancelled orders)
    const revenueStats = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          not: 'CANCELLED',
        },
      },
    });
    const totalRevenue = revenueStats._sum.totalAmount || 0;

    // Get recent orders (limit 5)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // Get recent customers (limit 5)
    const recentCustomers = await prisma.customer.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get stock levels status (low stock items, count where stock <= 10)
    const lowStockItems = await prisma.inventory.count({
      where: {
        stockQuantity: {
          lte: 10,
        },
      },
    });

     res.status(200).json({
      stats: {
        totalCustomers,
        totalProducts,
        totalOrders,
        totalInventory,
        totalRevenue,
        lowStockItems,
      },
      recentOrders,
      recentCustomers,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
     res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
  }
}
