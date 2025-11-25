import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Use global prefix 'api'
  app.setGlobalPrefix('api');

  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger/OpenAPI documentation from YAML file
  try {
    // Load and parse the OpenAPI YAML file
    // Try multiple paths to handle both dev (ts-node) and production (compiled) modes
    let openApiPath: string;
    if (__dirname.includes('dist')) {
      // Production mode: from dist/src, go up two levels to backend/
      openApiPath = join(__dirname, '..', '..', 'docs', 'openapi.yaml');
    } else {
      // Development mode: from src, go up one level to backend/
      openApiPath = join(__dirname, '..', 'docs', 'openapi.yaml');
    }
    const openApiYaml = readFileSync(openApiPath, 'utf-8');
    const openApiSpec = yaml.load(openApiYaml) as OpenAPIObject;

    // Use the parsed YAML spec directly
    SwaggerModule.setup('api-docs', app, openApiSpec, {
      customSiteTitle: 'API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      },
    });

    console.log(
      `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api-docs`,
    );
  } catch (error) {
    console.warn(
      'Could not load OpenAPI YAML file, using programmatic Swagger setup:',
      error,
    );

    // Fallback to programmatic setup
    const config = new DocumentBuilder()
      .setTitle('Full Stack Template API')
      .setDescription(
        'Comprehensive API documentation for the Full Stack Template application',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'bearerAuth',
      )
      .addServer('http://localhost:3000/api', 'Local development server')
      .addServer('https://api.example.com/api', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      customSiteTitle: 'API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });
  }

  // Add "Application Running on: http://host:port" log message
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application Running on: http://localhost:${port}`);
}
void bootstrap();
