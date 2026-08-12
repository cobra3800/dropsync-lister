import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ImportQueueService } from './import-queue.service.js';

@Injectable()
export class ImportQueueWorker
  implements OnModuleInit, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly importQueueService: ImportQueueService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.processQueue();
    }, 5000);

    void this.processQueue();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async processQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const result = await this.importQueueService.processNext();

      if (result) {
        console.log(
          `Import queue job ${result.id} finished with status ${result.status}`,
        );
      }
    } catch (error) {
      console.error('Import queue worker failed:', error);
    } finally {
      this.processing = false;
    }
  }
}