import { cn } from '@/lib/utils';
import { APP_ICON, BRAND, LOGOTYPE, MARK } from './geometry';

/** The V seated on its verdict block. Geometry lives in ./geometry (generated with brand/). */
function MarkShapes({ v, block }: { v: string; block: string }) {
  const b = MARK.block;
  return (
    <>
      <path d={MARK.v} fill={v} />
      <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={b.rx} fill={block} />
    </>
  );
}

/** Primary logo: the mark as the "V" of "veyr". Size it by height. */
export function Logotype({ className, title = 'Veyr' }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 ${LOGOTYPE.y} ${LOGOTYPE.width} ${LOGOTYPE.height}`}
      role="img"
      aria-label={title}
      className={cn('h-7 w-auto', className)}
    >
      <MarkShapes v={BRAND.ink} block={BRAND.ember} />
      <path transform={LOGOTYPE.textTransform} d={LOGOTYPE.text} fill={BRAND.ink} />
    </svg>
  );
}

/** Standalone mark, no container. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK.width} ${MARK.height}`} aria-hidden="true" className={cn('size-8', className)}>
      <MarkShapes v={BRAND.ink} block={BRAND.ember} />
    </svg>
  );
}

/** App-icon tile (same artwork as the favicon). */
export function AppIcon({ className }: { className?: string }) {
  const s = APP_ICON.size;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} aria-hidden="true" className={cn('size-8', className)}>
      <rect width={s} height={s} rx={APP_ICON.radius} fill={BRAND.ink} />
      <g transform={APP_ICON.markTransform}>
        <MarkShapes v={BRAND.cream} block={BRAND.emberBright} />
      </g>
    </svg>
  );
}
