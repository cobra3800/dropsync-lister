import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { AspectMapperService } from './aspect-mapper.service.js';
import { ImporterModule } from '../importer/importer.module.js';

@Module({
  imports: [ImporterModule],
  controllers: [AiController],
  providers: [
    AiService,
    AspectMapperService,
  ],
  exports: [
    AiService,
    AspectMapperService,
  ],
})
export class AiModule {}