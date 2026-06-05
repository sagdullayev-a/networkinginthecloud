import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'btec_networking_cloud_secret_key';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

     res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
     res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }

     res.status(200).json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
     res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ error: validation.error.issues[0].message });
       return;
    }

    const { name, email, password } = validation.data;

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
         res.status(400).json({ error: 'Email is already in use' });
         return;
      }
    }

    const updateData: any = { name, email };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    // Generate new token
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

     res.status(200).json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
     res.status(500).json({ error: 'Internal server error' });
  }
}
