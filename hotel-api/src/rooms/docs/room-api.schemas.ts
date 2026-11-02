// Reusable inline OpenAPI schemas for the Rooms API (used inside @ApiResponse({ schema })).

// One room as returned by Prisma. Decimal columns are serialized as strings in JSON.
export const ROOM_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Deluxe Sea View' },
    description: { type: 'string', nullable: true, example: 'King-size bed, balcony facing the sea' },
    capacity: { type: 'integer', example: 2 },
    price_per_night: { type: 'string', example: '2500.50' },
    image_url: { type: 'string', nullable: true, example: 'https://example.com/images/deluxe.jpg' },
    is_active: { type: 'boolean', example: true },
    created_at: { type: 'string', format: 'date-time', example: '2026-10-21T08:30:00.000Z' },
    updated_at: { type: 'string', format: 'date-time', example: '2026-10-21T08:30:00.000Z' },
  },
};

// GET /rooms : list + pagination metadata
export const ROOM_LIST_SCHEMA = {
  type: 'object',
  properties: {
    data: { type: 'array', items: ROOM_SCHEMA },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 42 },
        limit: { type: 'integer', example: 10 },
        offset: { type: 'integer', example: 0 },
      },
    },
  },
};

// DELETE /rooms/:id : custom success object
export const DELETE_SUCCESS_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Room 1 deleted successfully' },
  },
};

// NestJS default error body: { statusCode, message, error }
const errorSchema = (statusCode: number, message: string | string[], error?: string) => ({
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: statusCode },
    message: Array.isArray(message)
      ? { type: 'array', items: { type: 'string' }, example: message }
      : { type: 'string', example: message },
    ...(error ? { error: { type: 'string', example: error } } : {}),
  },
});

export const BAD_REQUEST_SCHEMA = errorSchema(
  400,
  ['name should not be empty', 'capacity must be an integer number'],
  'Bad Request',
);
export const UNAUTHORIZED_SCHEMA = errorSchema(401, 'Missing or invalid access token', 'Unauthorized');
export const FORBIDDEN_SCHEMA = errorSchema(403, 'Forbidden resource', 'Forbidden');
export const NOT_FOUND_SCHEMA = errorSchema(404, 'Room 99 not found', 'Not Found');
export const TOO_MANY_REQUESTS_SCHEMA = errorSchema(429, 'ThrottlerException: Too Many Requests');
