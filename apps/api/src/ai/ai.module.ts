import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { ImporterModule } from '../importer/importer.module.js';

@Module({
  imports: [ImporterModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}