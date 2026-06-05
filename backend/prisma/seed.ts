import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import process from 'process';
import * as dotenv from 'dotenv';

// Load environmental configuration
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/btec_cloud_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.inventory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Default User (Admin)
  const hashedPassword = await bcrypt.hash('Password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@clothingcorp.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log('Created User:', admin.email);

  // 3. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      companyName: 'Uzbek Apparel Ltd',
      contactPerson: 'Alisher Usmonov',
      email: 'alisher@uzapparel.uz',
      phone: '+998901234567',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyName: 'Tashkent Fashion House',
      contactPerson: 'Dilnoza Karimova',
      email: 'dilnoza@tfh.uz',
      phone: '+998937654321',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyName: 'Bukhara Silk & Cotton',
      contactPerson: 'Jasur Botirov',
      email: 'jasur@bukhara-cotton.uz',
      phone: '+998944567890',
    },
  });
  console.log('Created customers');

  // 4. Create Products and matching Inventory
  const productsData = [
    { name: 'Premium Cotton T-Shirt (Black, M)', sku: 'TS-BLK-M', price: 15.99, qty: 150 },
    { name: 'Over-sized Hoodie (Grey, L)', sku: 'HD-GRY-L', price: 39.99, qty: 80 },
    { name: 'Classic Denim Jacket (Blue, S)', sku: 'DJ-BLU-S', price: 49.99, qty: 45 },
    { name: 'Slim-fit Chino Pants (Khaki, 32)', sku: 'CP-KHA-32', price: 29.99, qty: 100 },
    { name: 'Woolen Winter Coat (Navy, XL)', sku: 'WC-NAV-XL', price: 89.99, qty: 30 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        quantity: p.qty,
      },
    });

    // Create corresponding Inventory record
    await prisma.inventory.create({
      data: {
        productId: product.id,
        stockQuantity: p.qty,
      },
    });

    products.push(product);
  }
  console.log('Created products and inventory');

  // 5. Create some orders
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      status: 'COMPLETED',
      totalAmount: 15.99 * 10 + 39.99 * 5, // 359.85
      orderItems: {
        create: [
          { productId: products[0].id, quantity: 10, price: products[0].price },
          { productId: products[1].id, quantity: 5, price: products[1].price },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      status: 'PENDING',
      totalAmount: 29.99 * 20, // 599.8
      orderItems: {
        create: [
          { productId: products[3].id, quantity: 20, price: products[3].price },
        ],
      },
    },
  });

  console.log('Created orders');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
