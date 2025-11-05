import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './database.config';

export const DATABASE = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (configService: ConfigService) => {
        const dbConfig = new DatabaseConfig(
          configService.get<string>('DATABASE_HOST', 'localhost'),
          configService.get<number>('DATABASE_PORT', 3306),
          configService.get<string>('DATABASE_USER', 'root'),
          configService.get<string>('DATABASE_PASSWORD', ''),
          configService.get<string>('DATABASE_NAME', 'fullstack_db'),
        );
        return dbConfig.getDb();
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
