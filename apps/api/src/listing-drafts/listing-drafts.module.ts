import { Module } from '@nestjs/common';
import { ListingDraftsController } from './listing-drafts.controller';
import { ListingDraftsService } from './listing-drafts.service';

@Module({
  controllers: [ListingDraftsController],
  providers: [ListingDraftsService]
})
export class ListingDraftsModule {}
