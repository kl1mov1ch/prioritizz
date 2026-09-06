import {
  IconLayers,
  IconSparkles,
  IconTag,
  IconShield,
  IconCard,
  type IconProps,
} from '@prioritizz/ui';

type IconCmp = (p: IconProps) => JSX.Element;

/**
 * Category slug → SVG glyph. Seeded categories ship an emoji in the DB;
 * the UI renders a real icon instead so the chrome stays one visual system.
 */
const BY_SLUG: Record<string, IconCmp> = {
  subscriptions: IconLayers,
  'telegram-gifts': IconSparkles,
  'digital-goods': IconTag,
  services: IconShield,
  'top-ups': IconCard,
};

export function CategoryIcon({ slug, size = 14 }: { slug: string; size?: number }) {
  const Cmp = BY_SLUG[slug] ?? IconTag;
  return <Cmp size={size} />;
}
