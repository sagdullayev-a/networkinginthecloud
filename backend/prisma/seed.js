"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
const process_1 = __importDefault(require("process"));
const dotenv = __importStar(require("dotenv"));
// Load environmental configuration
dotenv.config();
const connectionString = process_1.default.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/btec_cloud_db?schema=public';
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
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
    process_1.default.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
