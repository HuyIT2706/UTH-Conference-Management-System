import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRebuttalDto {
  @ApiProperty({
    description: 'ID của submission',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @ApiProperty({
    description: 'ID của conference (tùy chọn)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  conferenceId?: number;

  @ApiProperty({
    description: 'Nội dung phản hồi từ tác giả',
    example: 'Chúng tôi đã cập nhật phần thí nghiệm như góp ý của reviewers.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}









