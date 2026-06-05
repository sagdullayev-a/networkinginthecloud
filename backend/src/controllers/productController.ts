import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(3, 'SKU is required'),
  price: z.number().positive('Price must be greater than 0'),
  quantity: z.number().int().nonnegative('Quantity must be 0 or more'),
});

export async function getProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inventory: true,
      },
    });
     res.status(200).json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
     res.status(500).json({ error: 'Internal server error fetching products' });
  }
}

export async function getProductById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });

    if (!product) {
       res.status(404).json({ error: 'Product not found' });
       return;
    }

     res.status(200).json(product);
  } catch (error) {
    console.error('Fetch product error:', error);
     res.status(500).json({ error: 'Internal server error fetching product' });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { name, sku, price, quantity } = validation.data;

    // Check SKU unique
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
       res.status(400).json({ error: 'Product SKU already exists' });
       return;
    }

    // Run in transaction to guarantee consistency with inventory
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { name, sku, price, quantity },
      });

      await tx.inventory.create({
        data: {
          productId: product.id,
          stockQuantity: quantity,
        },
      });

      return product;
    });

     res.status(201).json(result);
  } catch (error) {
    console.error('Create product error:', error);
     res.status(500).json({ error: 'Internal server error creating product' });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { name, sku, price, quantity } = validation.data;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
       res.status(404).json({ error: 'Product not found' });
       return;
    }

    // SKU clash check
    if (sku !== product.sku) {
      const clashing = await prisma.product.findUnique({ where: { sku } });
      if (clashing) {
         res.status(400).json({ error: 'Product SKU already exists' });
         return;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { name, sku, price, quantity },
      });

      // Synchronize with inventory
      await tx.inventory.upsert({
        where: { productId: id },
        update: { stockQuantity: quantity },
        create: { productId: id, stockQuantity: quantity },
      });

      return updated;
    });

     res.status(200).json(result);
  } catch (error) {
    console.error('Update product error:', error);
     res.status(500).json({ error: 'Internal server error updating product' });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
       res.status(404).json({ error: 'Product not found' });
       return;
    }

    // Cascade deletes should handle it, but we can delete directly via prisma onDelete Cascade
    await prisma.product.delete({ where: { id } });
     res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
     res.status(500).json({ error: 'Internal server error deleting product' });
  }
}
