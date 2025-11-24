import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './repositories/clients.repository';
import { DatabaseModule } from '../database/database.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [DatabaseModule, OperationsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository],
  exports: [ClientsService],
})
export class ClientsModule {}
