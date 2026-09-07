import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { becomeSellerSchema, updateMeSchema } from '@prioritizz/schemas';
import { UsersService } from './users.service';
import { createZodDto } from '../../common/zod-dto';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class UpdateMeDto extends createZodDto(updateMeSchema) {}
class BecomeSellerDto extends createZodDto(becomeSellerSchema) {}

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'me', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() u: AuthContext) {
    return this.users.getProfile(u.userId);
  }

  @Patch()
  update(@CurrentUser() u: AuthContext, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(u.userId, dto);
  }

  @Get('wallet')
  wallet(@CurrentUser() u: AuthContext) {
    return this.users.wallet(u.userId);
  }

  @Post('seller')
  becomeSeller(@CurrentUser() u: AuthContext, @Body() dto: BecomeSellerDto) {
    return this.users.becomeSeller(u.userId, dto);
  }

  /** Import the caller's current Telegram profile photo as their avatar. */
  @Post('avatar/from-telegram')
  syncAvatar(@CurrentUser() u: AuthContext) {
    return this.users.syncAvatarFromTelegram(u.userId);
  }
}
