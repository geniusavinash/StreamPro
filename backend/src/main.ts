import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Multi-Camera Streaming Platform API')
    .setDescription(`
      ## Overview
      Comprehensive API for managing RTMP camera streams with real-time monitoring, recording, and analytics.
      
      ## Features
      - **Camera Management**: Add, configure, and monitor IP cameras
      - **Live Streaming**: RTMP ingestion with HLS/WebRTC output
      - **Recording**: Automated recording with multi-tier storage
      - **Real-time Monitoring**: Live status updates and alerts
      - **Analytics**: Comprehensive reporting and insights
      - **Security**: Role-based access control and API tokens
      
      ## Authentication
      This API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-token>\`
      
      ## Rate Limiting
      API requests are rate-limited per user/token. Check response headers for current limits.
      
      ## Webhooks
      The system supports webhooks for real-time notifications of camera events.
    `)
    .setVersion('1.0')
    .setContact('Support Team', 'https://example.com/support', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000/api/v1', 'Local Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'API-Key',
    )
    .addTag('auth', 'Authentication and user management')
    .addTag('cameras', 'Camera management and configuration')
    .addTag('streaming', 'Live streaming and RTMP management')
    .addTag('recording', 'Recording management and playback')
    .addTag('dashboard', 'Dashboard statistics and monitoring')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('settings', 'System configuration and settings')
    .addTag('api-tokens', 'API token management')
    .addTag('notifications', 'Notification and alert management')
    .addTag('monitoring', 'System monitoring and health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Multi-Camera Streaming Platform API',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`🔧 Development Mode: Local API only`);
}

bootstrap();
