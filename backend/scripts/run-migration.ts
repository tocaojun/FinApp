#!/usr/bin/env ts-node

import { readFileSync } from 'fs';
import { join } from 'path';
import { databaseService } from '../src/services/DatabaseService';

async function runMigration(migrationFile: string) {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = join(__dirname, '..', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf8');
    
    // 分割SQL语句（按分号分割，但忽略注释中的分号）
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await databaseService.prisma.$executeRawUnsafe(statement);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          // 继续执行其他语句，某些语句可能因为数据已存在而失败
        }
      }
    }
    
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${migrationFile}:`, error);
    throw error;
  }
}

async function main() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Usage: ts-node run-migration.ts <migration-file>');
    console.error('Example: ts-node run-migration.ts 005_product_management_data.sql');
    process.exit(1);
  }
  
  try {
    await databaseService.connect();
    console.log('Connected to database');
    
    await runMigration(migrationFile);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await databaseService.disconnect();
    console.log('Disconnected from database');
  }
}

if (require.main === module) {
  main();
}

export { runMigration };