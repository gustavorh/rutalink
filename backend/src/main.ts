import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

// ============================================================================
// Configuration Constants
// ============================================================================

const APP_CONFIG = {
  globalPrefix: 'api',
  openApiPath: 'docs',
  defaultPort: 3000,
} as const;

const CORS_CONFIG = {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
} as const;

const SWAGGER_UI_OPTIONS = {
  customSiteTitle: 'RutaLink API Documentation',
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
} as const;

// ============================================================================
// Setup Functions
// ============================================================================

/**
 * Configures global middleware: CORS, prefix, filters, and validation pipes.
 */
function setupGlobalMiddleware(app: INestApplication): void {
  app.enableCors(CORS_CONFIG);
  app.setGlobalPrefix(APP_CONFIG.globalPrefix);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/**
 * Resolves the OpenAPI YAML file path for both dev and production modes.
 */
function getOpenApiPath(): string {
  if (__dirname.includes('dist')) {
    // Production mode: from dist/src, go up two levels to backend/
    return join(
      __dirname,
      '..',
      '..',
      `${APP_CONFIG.openApiPath}`,
      'openapi.yaml',
    );
  }
  // Development mode: from src, go up one level to backend/
  return join(__dirname, '..', `${APP_CONFIG.openApiPath}`, 'openapi.yaml');
}

/**
 * Loads and parses the OpenAPI spec from the YAML file.
 */
function loadOpenApiSpec(): OpenAPIObject {
  const openApiPath = getOpenApiPath();
  const openApiYaml = readFileSync(openApiPath, 'utf-8');
  return yaml.load(openApiYaml) as OpenAPIObject;
}

/**
 * Creates a fallback OpenAPI document programmatically.
 */
function createFallbackOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('RutaLink API Documentation')
    .setDescription('API documentation for the RutaLink Backend')
    .setVersion('0.1.0')
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
    .addServer('http://localhost:3030/api', 'Local development server')
    .addServer('https://api.rutalink.gustavorh.com/api', 'Production server')
    .build();

  return SwaggerModule.createDocument(app, config);
}

/**
 * Sets up Swagger documentation from YAML file with programmatic fallback.
 */
function setupSwagger(app: INestApplication): void {
  let openApiSpec: OpenAPIObject;

  try {
    openApiSpec = loadOpenApiSpec();
  } catch (error) {
    console.warn(
      'Could not load OpenAPI YAML file, using programmatic Swagger setup:',
      error,
    );
    openApiSpec = createFallbackOpenApiDocument(app);
  }

  SwaggerModule.setup(
    APP_CONFIG.openApiPath,
    app,
    openApiSpec,
    SWAGGER_UI_OPTIONS,
  );
}

/**
 * Logs startup information to the console.
 */
function logStartupInfo(port: number | string): void {
  console.log(
    `Application Running on: http://localhost:${port}/${APP_CONFIG.globalPrefix}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${port}/${APP_CONFIG.openApiPath}`,
  );
}

// ============================================================================
// Bootstrap
// ============================================================================

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  setupGlobalMiddleware(app);
  setupSwagger(app);

  const port = process.env.PORT ?? APP_CONFIG.defaultPort;
  await app.listen(port);
  logStartupInfo(port);
}

void bootstrap();
