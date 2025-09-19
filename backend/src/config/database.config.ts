import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const dbType = process.env.DATABASE_TYPE || 'sqlite';
    
    if (dbType === 'sqlite') {
      return {
        type: 'sqlite',
        database: process.env.DATABASE_DATABASE || './camera_streaming.db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
        logging: process.env.DATABASE_LOGGING === 'true' || process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      };
    }
    
    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'camera_streaming',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
      charset: 'utf8mb4',
      timezone: '+00:00',
    };
  },
);