#!/usr/bin/env node

/**
 * Setup script for AI Literacy Quiz D1 Database
 * 
 * Usage:
 * 1. Create a D1 database: npx wrangler d1 create ai-literacy-quiz-db
 * 2. Update the database_id in wrangler.jsonc with the returned ID
 * 3. Run this script: node setup-db.js
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

async function setupDatabase() {
  try {
    console.log('🚀 Setting up AI Literacy Quiz D1 Database...\n');
    
    // Read the schema file
    const schema = readFileSync('./schema.sql', 'utf8');
    
    console.log('📝 Applying database schema...');
    
    // Apply the schema to D1
    execSync('npx wrangler d1 execute ai-literacy-quiz-db --file=./schema.sql --remote', { 
      stdio: 'inherit' 
    });
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the database_id in wrangler.jsonc with your actual database ID');
    console.log('2. Run: npm run deploy');
    console.log('3. Your quiz app will be live with D1 database!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. Created a D1 database with: npx wrangler d1 create ai-literacy-quiz-db');
    console.log('2. Updated the database_id in wrangler.jsonc');
    console.log('3. Are logged in to Cloudflare: npx wrangler login');
    process.exit(1);
  }
}

setupDatabase();
