import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { PreferenceType } from '../entities/review-preference.entity';

export class CreateBidDto {
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @IsEnum(PreferenceType)
  @IsNotEmpty()
  preference: PreferenceType;
}



