import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SubmissionSummary } from './entities/submission-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubmissionSummary])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
