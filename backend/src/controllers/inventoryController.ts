import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const updateInventorySchema = z.object({
  stockQuantity: z.number().int().nonnegative('Stock quantity must be 0 or more'),
});

export async function getInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            price: true,
          },
        },
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });
     res.status(200).json(inventory);
  } catch (error) {
    console.error('Fetch inventory error:', error);
     res.status(500).json({ error: 'Internal server error fetching inventory' });
  }
}

export async function updateStock(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string; // Inventory ID
    const validation = updateInventorySchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { stockQuantity } = validation.data;

    // Verify inventory record exists
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
       res.status(404).json({ error: 'Inventory record not found' });
       return;
    }

    // Run transaction to keep Product.quantity and Inventory.stockQuantity aligned
    const updatedInventory = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.update({
        where: { id },
        data: { stockQuantity },
        include: {
          product: true,
        },
      });

      await tx.product.update({
        where: { id: inv.productId },
        data: { quantity: stockQuantity },
      });

      return inv;
    });

     res.status(200).json(updatedInventory);
  } catch (error) {
    console.error('Update stock error:', error);
     res.status(500).json({ error: 'Internal server error updating stock' });
  }
}
