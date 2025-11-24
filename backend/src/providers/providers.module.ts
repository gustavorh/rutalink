import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { ProvidersRepository } from './repositories/providers.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersRepository],
  exports: [ProvidersService, ProvidersRepository],
})
export class ProvidersModule {}
