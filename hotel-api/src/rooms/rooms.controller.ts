import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards, Query, NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoomQueryDto } from './dto/room-query.dto';
import {
  BAD_REQUEST_SCHEMA,
  DELETE_SUCCESS_SCHEMA,
  FORBIDDEN_SCHEMA,
  NOT_FOUND_SCHEMA,
  ROOM_LIST_SCHEMA,
  ROOM_SCHEMA,
  TOO_MANY_REQUESTS_SCHEMA,
  UNAUTHORIZED_SCHEMA,
} from './docs/room-api.schemas';

@ApiTags('rooms')
@ApiBearerAuth('access-token')
@ApiResponse({ status: 401, description: 'Missing or invalid access token', schema: UNAUTHORIZED_SCHEMA })
@ApiResponse({ status: 429, description: 'Too Many Requests', schema: TOO_MANY_REQUESTS_SCHEMA })
@Controller('rooms')
@UseInterceptors(CacheInterceptor)
@Throttle({
  default: {
    limit: 10,
    ttl: 60000,
  },
})
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // POST /rooms
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new room (Admin only)' })
  @ApiResponse({ status: 201, description: 'Room created successfully', schema: ROOM_SCHEMA })
  @ApiResponse({ status: 400, description: 'Validation failed', schema: BAD_REQUEST_SCHEMA })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only', schema: FORBIDDEN_SCHEMA })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  // GET /rooms
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List rooms with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Max rooms to return (1-100, default 10)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0, description: 'Number of rooms to skip (default 0)' })
  @ApiResponse({ status: 200, description: 'Paginated list of rooms', schema: ROOM_LIST_SCHEMA })
  @ApiResponse({ status: 400, description: 'Invalid query parameters', schema: BAD_REQUEST_SCHEMA })
  findAll(@Query() query: RoomQueryDto) {
    return this.roomsService.findAll(query.limit ?? 10, query.offset ?? 0);
  }

  // GET /rooms/:id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Room details', schema: ROOM_SCHEMA })
  @ApiResponse({ status: 404, description: 'Room not found', schema: NOT_FOUND_SCHEMA })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  // PUT /rooms/:id 
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a room (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Room updated successfully', schema: ROOM_SCHEMA })
  @ApiResponse({ status: 400, description: 'Validation failed', schema: BAD_REQUEST_SCHEMA })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only', schema: FORBIDDEN_SCHEMA })
  @ApiResponse({ status: 404, description: 'Room not found', schema: NOT_FOUND_SCHEMA })
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    try {
      return await this.roomsService.update(+id, updateRoomDto);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Room ${id} not found`);
      }
      throw error;
    }
  }

  // PATCH /rooms/:id/disable
  @Patch(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Disable a room (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Room disabled (is_active = false)', schema: ROOM_SCHEMA })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only', schema: FORBIDDEN_SCHEMA })
  @ApiResponse({ status: 404, description: 'Room not found', schema: NOT_FOUND_SCHEMA })
  disable(@Param('id') id: string) {
    return this.roomsService.disable(+id);
  }

  // PATCH /rooms/:id/enable
  @Patch(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable a room (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Room enabled (is_active = true)', schema: ROOM_SCHEMA })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only', schema: FORBIDDEN_SCHEMA })
  @ApiResponse({ status: 404, description: 'Room not found', schema: NOT_FOUND_SCHEMA })
  enable(@Param('id') id: string) {
    return this.roomsService.enable(+id);
  }

  // DELETE /rooms/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a room (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Room deleted successfully', schema: DELETE_SUCCESS_SCHEMA })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only', schema: FORBIDDEN_SCHEMA })
  @ApiResponse({ status: 404, description: 'Room not found', schema: NOT_FOUND_SCHEMA })
  async remove(@Param('id') id: string) {      // ✏️ เพิ่ม async + try/catch
    try {
      return await this.roomsService.remove(+id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Room ${id} not found`);
      }
      throw error;
    }
  }
}