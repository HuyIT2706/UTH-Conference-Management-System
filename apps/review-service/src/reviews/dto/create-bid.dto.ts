import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PreferenceType } from '../entities/review-preference.entity';

export class CreateBidDto {
  @ApiProperty({
    description: 'ID của submission',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @ApiProperty({
    description: 'Mức độ quan tâm/bidding',
    enum: PreferenceType,
    example: PreferenceType.INTERESTED,
  })
  @IsEnum(PreferenceType)
  @IsNotEmpty()
  preference: PreferenceType;
}









