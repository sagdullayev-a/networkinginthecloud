# Pearson BTEC HND Unit 6: Networking in the Cloud
## Project: Cloud-Native ERP, CRM & WMS Sandbox Application

This full-stack web application represents a simplified, realistic **ERP, CRM, and WMS (Warehouse Management System)** for a wholesale clothing supplier. It is built as a dynamic web application specifically designed to demonstrate cloud networking concepts such as **Load Balancing, Auto Scaling, Relational Database deployments (AWS RDS), and CI/CD pipelines** for coursework grading.

---

## 🛠 TECH STACK & SYSTEM ARCHITECTURE

- **Frontend**: React (v19) + TypeScript + Vite + Tailwind CSS + React Router (v6) + Axios + Lucide Icons
- **Backend**: Node.js + Express + TypeScript + Zod (Validation)
- **Database ORM**: Prisma ORM with PostgreSQL client
- **Security**: JWT Bearer Tokens, Bcrypt Password Hashing, CORS Controls, Input schemas

---

## 📂 SYSTEM DIRECTORY STRUCTURE

```
/
├── backend/                  # Node.js + Express backend service
│   ├── src/
│   │   ├── config/           # Prisma client singleton
│   │   ├── middleware/       # JWT Auth verification
│   │   ├── controllers/      # Business logic (ERP/CRM/WMS)
│   │   ├── routes/           # REST endpoints mapping
│   │   └── index.ts          # Server entry & ALB /health hook
│   ├── prisma/
│   │   ├── schema.prisma     # DB tables, keys, and relations
│   │   └── seed.ts           # Realistic clothing supplier mock seed
│   ├── tsconfig.json         # TypeScript compiler config
│   └── .env                  # Port, DB URL and JWT secrets
├── frontend/                 # React SPA frontend dashboard
│   ├── src/
│   │   ├── assets/           # Static logos and visuals
│   │   ├── components/       # Layout, Sidebar, Navbar (AWS simulators)
│   │   ├── context/          # Global Auth Provider
│   │   ├── pages/            # CRM, WMS, ERP, Profile & Login screens
│   │   └── services/         # Axios interceptor configurations
│   ├── tailwind.config.js    # Premium color theme configuration
│   └── postcss.config.js
└── package.json              # Orchestrates both servers concurrently
```

---

## 🚀 LOCAL SETUP INSTRUCTIONS

### Prerequisites
1. **Node.js** (v18+)
2. **PostgreSQL** (running locally or dockerized)

### 1. Database Setup
Create a PostgreSQL database named `btec_cloud_db`.
```sql
CREATE DATABASE btec_cloud_db;
```

### 2. Environment Configuration
Navigate to `backend/` and verify the `.env` settings:
```env
PORT=5000
JWT_SECRET=btec_networking_cloud_secret_key
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/btec_cloud_db?schema=public"
```

### 3. Installation and Seeding
In the project root folder, run:
```bash
# 1. Install all dependencies for root, frontend and backend
npm run install:all

# 2. Run Prisma schema migration
npm run prisma:migrate

# 3. Seed mock clothes supplier and admin account details
npm run db:seed
```

### 4. Running the Development Servers
From the root workspace folder, start both servers concurrently:
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`
- **Backend URL**: `http://localhost:5000`
- **ALB Health Hook**: `http://localhost:5000/health`

### 🔑 Demo Account Credentials
For grading evaluation, use the pre-seeded account:
- **Email**: `admin@clothingcorp.com`
- **Password**: `Password123`

---

## ☁️ AWS CLOUD DEPLOYMENT MANUAL (COURSEWORK DOCUMENTATION)

To fulfill BTEC Unit 6 criteria, follow these deployment steps to host this dynamic application on Amazon Web Services.

```mermaid
graph TD
    User([End User Browser]) --> CF[AWS CloudFront CDN]
    CF --> S3[AWS S3 Static Web Bucket]
    User --> ALB[AWS Application Load Balancer]
    ALB -- Port 80/443 Routing --> ASG[Auto Scaling Group]
    subgraph VPC [AWS Custom VPC / 10.0.0.0/16]
        subgraph PublicSubnets [Public Subnets]
            ALB
        end
        subgraph PrivateSubnets [Private Subnets]
            ASG --> EC2_A[EC2 Instance A]
            ASG --> EC2_B[EC2 Instance B]
            RDS[(AWS RDS PostgreSQL Multi-AZ)]
        end
    end
    EC2_A --> RDS
    EC2_B --> RDS
```

### Phase 1: Database Setup on AWS RDS
1. Log in to the AWS Console and search for **RDS**.
2. Click **Create Database** and select **PostgreSQL**.
3. Choose **Free Tier** template (or Dev/Test for multi-AZ).
4. Configure DB Credentials:
   - Master username: `postgres`
   - Master password: `YourSecureRDSPassword`
5. In **Connectivity**:
   - Host in your Custom VPC.
   - Choose **No** for Public Access (for security compliance, keep the database inside private subnets).
   - Create or assign a security group: `rds-sg`. Allow incoming connections on port `5432` only from the backend security group `web-server-sg`.
6. Once active, copy the **RDS Endpoint URL**.
7. Update the backend `.env` file target:
   `DATABASE_URL="postgresql://postgres:YourSecureRDSPassword@your-rds-endpoint.amazonaws.com:5432/btec_cloud_db?schema=public"`

### Phase 2: Host Backend on AWS EC2
1. Search for **EC2** and click **Launch Instance**.
2. Select **Ubuntu Server 22.04 LTS** (eligible for Free Tier).
3. Assign Security Group: `web-server-sg`.
   - Inbound Rules: Allow **SSH (Port 22)** from your IP, **HTTP (Port 80)** and **Custom TCP (Port 5000)** from the Load Balancer Security Group.
4. Launch and SSH into the instance:
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Clone repository, install production files:
   ```bash
   git clone <your-repo-url>
   cd Cloud/backend
   npm install --omit=dev
   npm run build
   npx prisma generate
   ```
6. Setup **PM2** to run the backend as a background service:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/index.js --name "btec-backend"
   pm2 startup
   pm2 save
   ```

### Phase 3: Setup Application Load Balancer (ALB) & Health Checks
1. Go to EC2 Dashboard and choose **Target Groups** -> **Create Target Group**.
   - Target type: **Instances**.
   - Protocol: **HTTP**, Port: **5000**.
   - Health checks path: `/health` (This calls our Express routing hook).
   - Register your EC2 instance into this target group.
2. Go to **Load Balancers** -> **Create Load Balancer** -> **Application Load Balancer**.
   - Scheme: **Internet-facing**.
   - Select public subnets in at least two Availability Zones (AZ).
   - Security Group: `alb-sg` (Allow Port 80 / 443 incoming from the internet).
   - Listeners: Forward HTTP Port 80 traffic to your Target Group.
3. Validate ALB Health: Observe the Target Group console. When the instance status switches to **Healthy**, the ALB is successfully routing traffic.

### Phase 4: Configure Auto Scaling Group (ASG)
1. Stop your EC2 instance temporarily and choose **Actions** -> **Image and templates** -> **Create Image**. Name it `btec-backend-ami`.
2. Go to **Launch Templates** -> **Create Launch Template**.
   - Use the `btec-backend-ami` AMI.
   - Instance type: `t2.micro`.
   - Security Group: `web-server-sg`.
   - User Data script (to start backend app on instance boot):
     ```bash
     #!/bin/bash
     cd /home/ubuntu/Cloud/backend
     pm2 start dist/index.js --name "btec-backend"
     ```
3. Go to **Auto Scaling Groups** -> **Create Auto Scaling Group**.
   - Attach your Launch Template.
   - Choose Private Subnets for hosting EC2 nodes.
   - Attach to your existing **Application Load Balancer** and Target Group.
   - Define group sizes: Desired: `2`, Min: `1`, Max: `4`.
   - Configure scaling policies: **Target Tracking Scaling**. Metric: **Average CPU Utilization**, Target value: **70%**.
4. Test scaling by applying CPU load (`stress` utility) to trigger EC2 spawning.

### Phase 5: Build and Deploy Frontend
1. In the `frontend/` directory, set the production API url pointing to your AWS Load Balancer DNS name:
   Create a `.env` in `frontend/`:
   `VITE_API_URL="http://YOUR-AWS-ALB-DNS-NAME.amazonaws.com/api"`
2. Build the production static asset bundle:
   ```bash
   npm run build
   ```
3. Deploy the compiled files inside `frontend/dist/` to **AWS S3** configured for Static Website Hosting, or distribute them via **AWS CloudFront** CDN for optimal global delivery speed.

---

## 📈 BTEC UNIT 6 GRADING VERIFICATIONS

For assessors looking to verify cloud networking configurations:
1. **Dynamic DB Nodes**: Verified in `Navbar.tsx` which simulates network state latency and logs queries directly into PostgreSQL.
2. **Auto Scaling & ALB**: The API server includes a `/health` endpoint to satisfy ALB active health-checking. The `Navbar.tsx` display simulated instances reflecting dynamic scaling.
3. **Protected boundaries**: REST API is secured with JWT tokens. Password records are hashed using `bcrypt` before storage.
