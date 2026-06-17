import { cn } from '@/lib/utils';

/**
 * HearMe logo: a stylized "H" flanked by sound waves, per the brand kit.
 * `withWordmark` renders the "HearMe" text beside the mark.
 */
export function Logo({
  className,
  withWordmark = true,
  size = 32,
}: {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="text-primary"
      >
        {/* left waves */}
        <path
          d="M9 18c-2.2 2-2.2 10 0 12M5 15c-3.5 3-3.5 15 0 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* H */}
        <path
          d="M18 12v24M30 12v24M18 24h12"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* right waves */}
        <path
          d="M39 18c2.2 2 2.2 10 0 12M43 15c3.5 3 3.5 15 0 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
      {withWordmark && <span className="text-xl font-bold tracking-tight">HearMe</span>}
    </span>
  );
}
