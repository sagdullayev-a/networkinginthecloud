import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const customerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
});

export async function getCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
     res.status(200).json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
     res.status(500).json({ error: 'Internal server error fetching customers' });
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
       res.status(404).json({ error: 'Customer not found' });
       return;
    }

     res.status(200).json(customer);
  } catch (error) {
    console.error('Fetch customer error:', error);
     res.status(500).json({ error: 'Internal server error fetching customer' });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const validation = customerSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { companyName, contactPerson, email, phone } = validation.data;

    // Check if email already exists
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
       res.status(400).json({ error: 'A customer with this email already exists' });
       return;
    }

    const customer = await prisma.customer.create({
      data: { companyName, contactPerson, email, phone },
    });

     res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
     res.status(500).json({ error: 'Internal server error creating customer' });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const validation = customerSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { companyName, contactPerson, email, phone } = validation.data;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
       res.status(404).json({ error: 'Customer not found' });
       return;
    }

    // Check email clash
    if (email !== customer.email) {
      const clashing = await prisma.customer.findUnique({ where: { email } });
      if (clashing) {
         res.status(400).json({ error: 'A customer with this email already exists' });
         return;
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { companyName, contactPerson, email, phone },
    });

     res.status(200).json(updated);
  } catch (error) {
    console.error('Update customer error:', error);
     res.status(500).json({ error: 'Internal server error updating customer' });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
       res.status(404).json({ error: 'Customer not found' });
       return;
    }

    await prisma.customer.delete({ where: { id } });
     res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
     res.status(500).json({ error: 'Internal server error deleting customer' });
  }
}
