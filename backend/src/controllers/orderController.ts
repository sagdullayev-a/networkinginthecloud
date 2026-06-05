import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
  })).min(1, 'Order must contain at least one item'),
});

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
});

export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
     res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
     res.status(500).json({ error: 'Internal server error fetching orders' });
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
       res.status(404).json({ error: 'Order not found' });
       return;
    }

     res.status(200).json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
     res.status(500).json({ error: 'Internal server error fetching order' });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const validation = createOrderSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { customerId, items } = validation.data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
       res.status(400).json({ error: 'Customer not found' });
       return;
    }

    // Process order items and verify inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsToCreate = [];

      for (const item of items) {
        // Fetch product and lock row if supported, or read
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price, // Hold the historical price
        });

        // Deduct from product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Deduct from inventory stock
        await tx.inventory.update({
          where: { productId: product.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          customerId,
          totalAmount,
          status: 'PENDING',
          orderItems: {
            create: itemsToCreate,
          },
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      return order;
    });

     res.status(201).json(result);
  } catch (error: any) {
    console.error('Create order error:', error);
    if (error.message && error.message.includes('stock') || error.message.includes('not found')) {
       res.status(400).json({ error: error.message });
    } else {
       res.status(500).json({ error: 'Internal server error creating order' });
    }
  }
}

export async function updateOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const validation = updateOrderSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { status } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
       res.status(404).json({ error: 'Order not found' });
       return;
    }

    // Handle stock reversal if order is CANCELLED and was not already cancelled
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status },
        });
      });
    } else if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      // Re-verify and deduct stock if reverting from CANCELLED to PENDING/COMPLETED
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.quantity < item.quantity) {
            throw new Error(`Cannot restore order. Insufficient stock for product: ${product?.name || 'Unknown'}`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status },
        });
      });
    } else {
      // Simple status update (e.g. PENDING -> SHIPPED -> COMPLETED)
      await prisma.order.update({
        where: { id },
        data: { status },
      });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: { product: true },
        },
      },
    });

     res.status(200).json(updatedOrder);
  } catch (error: any) {
    console.error('Update order error:', error);
    if (error.message && error.message.includes('stock')) {
       res.status(400).json({ error: error.message });
    } else {
       res.status(500).json({ error: 'Internal server error updating order' });
    }
  }
}

export async function deleteOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
       res.status(404).json({ error: 'Order not found' });
       return;
    }

    // If order was not cancelled, restore the stock before deleting
    if (order.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
        await tx.order.delete({ where: { id } });
      });
    } else {
      await prisma.order.delete({ where: { id } });
    }

     res.status(200).json({ message: 'Order deleted and inventory restored successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
     res.status(500).json({ error: 'Internal server error deleting order' });
  }
}
