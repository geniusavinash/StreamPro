import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { InitialDataSeeder } from './initial-data.seeder';
import { User, Camera, Recording, ApiToken, AuditLog } from '../entities';

// Load environment variables
config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_NAME', 'camera_streaming'),
  entities: [User, Camera, Recording, ApiToken, AuditLog],
  synchronize: true,
  charset: 'utf8mb4',
});

async function runSeeders() {
  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    const initialDataSeeder = new InitialDataSeeder(dataSource);
    await initialDataSeeder.run();

    await dataSource.destroy();
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeders();