import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { OnboardingService } from './onboarding.service';

const CompleteSchema = z.object({
  language: z.string().min(1),
  voiceId: z.string().min(1),
  conversationStyle: z.string().min(1),
});

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /** Public: everything the onboarding UI needs in one call. */
  @Get('options')
  options() {
    return {
      languages: this.onboarding.languages(),
      styles: this.onboarding.styles(),
      plans: this.onboarding.plans(),
      flags: this.onboarding.featureFlags(),
    };
  }

  @Get('voices')
  voices() {
    return this.onboarding.listVoices();
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('complete')
  complete(
    @CurrentUser() user: { uid: string },
    @Body() body: unknown,
  ) {
    const input = CompleteSchema.parse(body);
    return this.onboarding.complete(user.uid, input);
  }
}
