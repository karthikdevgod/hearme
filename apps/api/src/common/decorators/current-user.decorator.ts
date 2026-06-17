import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from '../guards/firebase-auth.guard';

/** Injects the authenticated user (set by FirebaseAuthGuard) into a handler param. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});
