import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { prisma } from './utils/prisma.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database (goldloan_db)');

    app.listen(PORT, () => {
      console.log(`✓ Gold Loan Management Server running on http://localhost:${PORT}`);
      console.log(`✓ API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

