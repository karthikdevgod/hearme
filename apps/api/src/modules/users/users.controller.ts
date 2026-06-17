import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UsersService } from './users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Current user; provisions the profile on first call. */
  @Get('me')
  me(@CurrentUser() user: { uid: string; email?: string }) {
    return this.users.getOrCreate(user);
  }
}
