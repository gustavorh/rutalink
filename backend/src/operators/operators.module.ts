import { Module } from '@nestjs/common';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';
import { OperatorsRepository } from './repositories/operators.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OperatorsController],
  providers: [OperatorsService, OperatorsRepository],
  exports: [OperatorsService, OperatorsRepository],
})
export class OperatorsModule {}
