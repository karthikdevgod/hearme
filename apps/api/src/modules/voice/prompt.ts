import { CONVERSATION_STYLES, LANGUAGES, type Memory } from '@hearme/shared';

/**
 * Builds the system prompt for a conversation turn: base companion persona +
 * selected style + target language + injected long-term memory + safety rails.
 * Tuned for voice — replies must stay short and conversational.
 */
export function buildSystemPrompt(opts: {
  languageCode: string;
  styleId: string | null;
  memory: Memory | null;
}): string {
  const lang = LANGUAGES[opts.languageCode];
  const style = CONVERSATION_STYLES.find((s) => s.id === opts.styleId);

  const languageName =
    opts.languageCode === 'hinglish'
      ? 'Hinglish (a natural mix of Hindi and English, written in Latin script)'
      : (lang?.label ?? 'English');

  const lines: string[] = [
    'You are HearMe, a supportive voice conversation companion.',
    'You actively listen and ask thoughtful, open follow-up questions.',
    'You help the user reflect on and express what they are feeling.',
    'You never claim to be a therapist, doctor, or counselor, and you never diagnose.',
    `You always respond in ${languageName}.`,
    'This is a SPOKEN conversation: keep replies short (1–3 sentences), warm, and natural. Avoid lists and markdown.',
  ];

  if (style) lines.push(`Style: ${style.promptDirective}`);

  if (opts.memory) {
    const m = opts.memory;
    const mem: string[] = [];
    if (m.goals.length) mem.push(`Goals: ${m.goals.join('; ')}`);
    if (m.interests.length) mem.push(`Interests: ${m.interests.join('; ')}`);
    if (m.recurringConcerns.length) mem.push(`Recurring concerns: ${m.recurringConcerns.join('; ')}`);
    if (m.importantEvents.length) mem.push(`Important events: ${m.importantEvents.join('; ')}`);
    if (mem.length) {
      lines.push(
        `What you remember about this person (reference naturally only when relevant): ${mem.join(' | ')}`,
      );
    }
  }

  lines.push(
    'If the person expresses thoughts of self-harm or being in crisis, respond with calm care, ' +
      'encourage them to reach out to a local emergency number or crisis helpline, and never act as a clinician.',
  );

  return lines.join('\n');
}
