import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { OperatorsModule } from './operators/operators.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClientsModule } from './clients/clients.module';
import { ProvidersModule } from './providers/providers.module';
import { RoutesModule } from './routes/routes.module';
import { OperationsModule } from './operations/operations.module';
import { AuditInterceptor } from './auth/interceptors/audit.interceptor';

// Resolve public folder path for both dev (ts-node) and production (compiled) modes
const getPublicPath = (): string => {
  if (__dirname.includes('dist')) {
    // Production: from dist/src, go up two levels to backend/public
    return join(__dirname, '..', '..', 'public');
  }
  // Development: from src, go up one level to backend/public
  return join(__dirname, '..', 'public');
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: getPublicPath(),
      serveRoot: '/',
      exclude: ['/api/{*path}'], // Exclude API routes from static serving
      serveStaticOptions: {
        index: false,
        fallthrough: false, // Return 404 immediately if file not found
      },
    }),
    DatabaseModule,
    OperatorsModule,
    UsersModule,
    AuthModule,
    AuditModule,
    DriversModule,
    VehiclesModule,
    ClientsModule,
    ProvidersModule,
    RoutesModule,
    OperationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
