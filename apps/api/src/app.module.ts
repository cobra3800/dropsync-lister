import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { StoresModule } from './stores/stores.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    StoresModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
