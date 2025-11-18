import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { PdfService } from './pdf.service';
import { ExcelService } from './excel.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OperationsController],
  providers: [OperationsService, PdfService, ExcelService],
  exports: [OperationsService],
})
export class OperationsModule {}
