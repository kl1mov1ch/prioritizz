import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

/**
 * Shared stroke-icon frame. 24px grid, 1.75 stroke, rounded joins.
 * All icons inherit `currentColor` so they tint with text.
 */
function Svg({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconBag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 8h12l1 12H5L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const IconReceipt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5 7.5 5 9 3.5 10.5 5 12 3.5 13.5 5 15 3.5 16.5 5 18 3.5V20l-1.5-1.5L15 20l-1.5-1.5L12 20l-1.5-1.5L9 20l-1.5-1.5L6 20V3.5Z" />
    <path d="M9 8.5h6M9 12h6M9 15.5h4" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.4-3.6 4-5.5 7-5.5s5.6 1.9 7 5.5" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </Svg>
);

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5.5c0 4.7 3 8 7 9.5 4-1.5 7-4.8 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4.5" />
  </Svg>
);

const STAR_PATH = 'M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.4 20l1-6L3.1 9.9l6-.9L12 3.5Z';

/** `filled` paints the star solid — needed for rating widgets. */
export const IconStar = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path d={STAR_PATH} fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

/** Half-filled star for fractional averages (4.5 ★). */
export const IconStarHalf = (p: IconProps) => {
  const id = React.useId();
  return (
    <Svg {...p}>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={STAR_PATH} fill={`url(#${id})`} />
    </Svg>
  );
};

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v1H6.5A2.5 2.5 0 0 1 4 8.5Z" />
    <path d="M4 8.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" />
    <path d="M20 12.5h-4a1.75 1.75 0 0 0 0 3.5h4v-3.5Z" />
  </Svg>
);

export const IconSparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4c.6 3.4 1.6 4.4 5 5-3.4.6-4.4 1.6-5 5-.6-3.4-1.6-4.4-5-5 3.4-.6 4.4-1.6 5-5Z" />
    <path d="M18.5 13c.3 1.6.8 2.1 2.5 2.5-1.7.3-2.2.9-2.5 2.5-.3-1.6-.8-2.1-2.5-2.5 1.7-.4 2.2-.9 2.5-2.5Z" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5S14.5 18.1 12 20.5C9.5 18.1 8.2 15.1 8.2 12S9.5 5.9 12 3.5Z" />
  </Svg>
);

export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V8M17 20v-9" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19c1.1-2.9 3.2-4.4 5.5-4.4s4.4 1.5 5.5 4.4" />
    <path d="M16 5.2A3 3 0 0 1 16 11M17.5 14.8c1.7.5 3.1 1.9 4 4.2" />
  </Svg>
);

export const IconGavel = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14 6-4 4M16 4l4 4M9 11l4 4" />
    <path d="m11 9-6.5 6.5a2.1 2.1 0 0 0 3 3L14 12" />
    <path d="M13 19h8" />
  </Svg>
);

export const IconCard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M6.5 14.5h4" />
  </Svg>
);

export const IconPercent = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 18 12-12" />
    <circle cx="7.5" cy="7.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H15" />
    <path d="M11 12h9M16.5 8.5 20 12l-3.5 3.5" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.5l3.5 2" />
  </Svg>
);

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5V5.5A1.5 1.5 0 0 1 5.5 4h7l7.5 7.5a1.7 1.7 0 0 1 0 2.4l-5.1 5.1a1.7 1.7 0 0 1-2.4 0L4 12.5Z" />
    <circle cx="8.5" cy="8.5" r="1.5" />
  </Svg>
);

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Media & editing
// ---------------------------------------------------------------------------

export const IconCamera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.4-2h7.8l1.4 2h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 16V4M8 7.5 12 3.5l4 4" />
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Svg>
);

export const IconPaperclip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11.5 12.2 19a4.5 4.5 0 0 1-6.4-6.4l8-7.8a3 3 0 0 1 4.3 4.3l-7.9 7.8a1.5 1.5 0 0 1-2.2-2.2l7.3-7.2" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5h16M9.5 6.5V4.5h5v2" />
    <path d="M6.5 6.5 7.4 20h9.2l.9-13.5" />
    <path d="M10.5 10v6M13.5 10v6" />
  </Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3Z" />
    <path d="m14.5 7.5 2 2" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Navigation & chrome
// ---------------------------------------------------------------------------

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const IconChevronUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 14.5 7-7 7 7" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 9.5 7 7 7-7" />
  </Svg>
);

export const IconEllipsis = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconGear = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0V21a1.6 1.6 0 0 0-2.7-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H2.8a2 2 0 1 1 0-4H3a1.6 1.6 0 0 0 1.2-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6V4.4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11h.2a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.6 1Z" />
  </Svg>
);

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15L18 15.5Z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
);

export const IconStorefront = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5 5.5 4.5h13L20 9.5" />
    <path d="M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    <path d="M5.5 11.5V20h13v-8.5" />
    <path d="M10 20v-4.5h4V20" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L4.5 20.5l1.2-3.2A6.2 6.2 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
  </Svg>
);

export const IconSend = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 3.5 10.5 13.5" />
    <path d="M20.5 3.5 14 20.5l-3.5-7-7-3.5 17-6.5Z" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Search & filtering
// ---------------------------------------------------------------------------

export const IconSliders = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="10" cy="17" r="2.2" />
  </Svg>
);

export const IconSort = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4.5v15M7 19.5 4 16.5M7 19.5l3-3" />
    <path d="M17 19.5v-15M17 4.5l-3 3M17 4.5l3 3" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </Svg>
);

export const IconXCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Svg>
);

export const IconInfoCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.75h.01" />
  </Svg>
);

export const IconRefresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4.5V10h-5.5" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 6 9.5 6a16 16 0 0 1-2.9 3.6M6.4 6.9A16 16 0 0 0 2.5 11s3.5 6 9.5 6c1.6 0 3-.4 4.2-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5" />
  </Svg>
);

export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
    <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3.5V6M16 3.5V6" />
  </Svg>
);

export const IconCoin = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.5 9.5a3 3 0 0 0-2.5-1.2c-1.4 0-2.4.8-2.4 1.9 0 2.6 5 1.4 5 4 0 1.2-1.1 2-2.6 2a3 3 0 0 1-2.5-1.2M12 6.5v11" />
  </Svg>
);

export const IconSpinner = ({ size = 20, className, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={['animate-spin', className].filter(Boolean).join(' ')}
    {...p}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
