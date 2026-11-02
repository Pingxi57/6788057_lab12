import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsNumber} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ description: 'Room name', example: 'Deluxe Sea View', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiPropertyOptional({ description: 'Detailed description of the room', example: 'King-size bed, balcony facing the sea' })
    @IsOptional()
    @IsString()
    description?: string;     

    @ApiProperty({ description: 'Maximum number of guests', example: 2, type: 'integer' })
    @IsInt()
    capacity!: number;

    @ApiProperty({ description: 'Price per night in THB', example: 2500.5, type: Number })   // 👈
    @IsNumber()
    price_per_night!: number;

    @ApiPropertyOptional({ description: 'URL of the room image', example: 'https://example.com/images/deluxe.jpg', maxLength: 255 })   // 👈
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiPropertyOptional({ description: 'Whether the room can be booked', example: true, default: true })   // 👈
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
