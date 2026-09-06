import { createZodDto } from '../../common/zod-dto';
import { adminLoginSchema, refreshSchema, telegramInitDataSchema } from '@prioritizz/schemas';

export class TelegramLoginDto extends createZodDto(telegramInitDataSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class AdminLoginDto extends createZodDto(adminLoginSchema) {}
