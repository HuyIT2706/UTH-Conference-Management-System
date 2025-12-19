import { IsDateString, IsNotEmpty } from 'class-validator';

export class SetCfpSettingDto {
  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @IsDateString()
  @IsNotEmpty()
  reviewDeadline: string;

  @IsDateString()
  @IsNotEmpty()
  notificationDate: string;

  @IsDateString()
  @IsNotEmpty()
  cameraReadyDeadline: string;
}
