import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

export interface AuthedRequest extends Request {
  user: { uid: string; email?: string; role?: string };
}

/**
 * Verifies the `Authorization: Bearer <Firebase ID token>` header and attaches
 * the decoded user to the request. Apply with `@UseGuards(FirebaseAuthGuard)`.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    try {
      const decoded = await this.firebase.verifyIdToken(header.slice(7));
      req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role as string };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
