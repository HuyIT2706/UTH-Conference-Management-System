import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCfpSettingDto {
  @ApiProperty({
    description: 'Hạn cuối nộp bài (ISO 8601)',
    example: '2025-03-01T23:59:59.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @ApiProperty({
    description: 'Hạn cuối phản biện (ISO 8601)',
    example: '2025-03-15T23:59:59.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  reviewDeadline: string;

  @ApiProperty({
    description: 'Ngày thông báo kết quả (ISO 8601)',
    example: '2025-04-01T12:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  notificationDate: string;

  @ApiProperty({
    description: 'Hạn cuối nộp camera-ready (ISO 8601)',
    example: '2025-04-15T23:59:59.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  cameraReadyDeadline: string;
}
