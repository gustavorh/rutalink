import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './repositories/roles.repository';
import { UsersModule } from '../users/users.module';
import { OperatorsModule } from '../operators/operators.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    UsersModule,
    OperatorsModule,
    DatabaseModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret:
            configService.get<string>('JWT_SECRET') ||
            'your-secret-key-change-in-production',
          signOptions: {
            expiresIn: '24h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, RolesController],
  providers: [AuthService, RolesService, RolesRepository, JwtStrategy, LocalStrategy],
  exports: [AuthService, RolesService, RolesRepository],
})
export class AuthModule {}
