import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger('RoomsService');

  async create(dto: CreateRoomDto) {
    this.logger.log('Creating a new room');
    try{
    return await this.prisma.rooms.create({      // ✏️ แก้ 1: เติม await
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        price_per_night: dto.price_per_night,
        image_url: dto.image_url,
        is_active: dto.is_active?? true,

      },
    });
   } catch (error){
    this.logger.error('Failed to create room');
    throw error;
   }
  }

  async findAll(limit = 10, offset = 0) {
    this.logger.log(`Getting rooms (limit=${limit}, offset=${offset})`);
    const [data, total] = await Promise.all([
      this.prisma.rooms.findMany({ skip: offset, take: limit, orderBy: { id: 'asc' } }),
      this.prisma.rooms.count(),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: number) {
    this.logger.log(`Finding room ${id}`);
    const room = await this.prisma.rooms.findUnique({ where: { id } });
    if (!room){
      this.logger.warn(`Room ${id} not found`);
      throw new NotFoundException(`Room ${id} not found`)
    }
    return room;
  }

  async disable(id: number){
    this.logger.log(`Disabling room ${id}`);
    try{
    await this.findOne(id);

    return this.prisma.rooms.update({
      where: { id },
      data: { is_active: false },
    });
  } catch (error){
    this.logger.error(`Failed to disable room ${id}`);
    throw error;
  }
  }

  async enable(id: number){
    this.logger.log(`Enabling room ${id}`);
    try{
    await this.findOne(id);

    return this.prisma.rooms.update({
      where: { id },
      data: { is_active: true },
    });
    }
    catch (error){
    this.logger.error(`Failed to enable room ${id}`);
    throw error;
  }
  }

  // ✏️ แก้ 2: update ทำงานจริงแล้ว (เดิมแค่ return ข้อความ)
  async update(id: number, updateRoomDto: UpdateRoomDto) {
    this.logger.log(`Updating room ${id}`);
    await this.findOne(id); // throws 404 if the room does not exist
    return this.prisma.rooms.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  async remove(id: number) {
    this.logger.log(`Deleting room ${id}`);
    await this.findOne(id); // throws 404 if the room does not exist
    await this.prisma.rooms.delete({ where: { id } });
    return { success: true, message: `Room ${id} deleted successfully` };
  }
}