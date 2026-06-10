import { useMemo, useRef, useCallback, useState } from 'react';
import { create } from 'qrcode';
import { Download, Loader2 } from 'lucide-react';
import { useTrans } from '../i18n';

interface Props {
  uuid: string;
  imageUrl?: string;
  size?: number;
}

const QUIET_ZONE = 4;
const LOGO_SIZE = 88;
const BG = '#fdf8ee';
const FG = '#1c0d00';
const GOLD = '#c8960c';
const GOLD_LIGHT = '#e8b84b';

const FTL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88">
  <rect width="88" height="88" fill="${BG}" rx="14"/>
  <circle cx="44" cy="44" r="28" fill="none" stroke="${GOLD}" stroke-width="3"/>
  <text x="44" y="38" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-weight="800" font-size="17" fill="${FG}">FTL</text>
  <line x1="63" y1="63" x2="72" y2="72" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="40" cy="56" r="8" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
  <line x1="46" y1="62" x2="50" y2="66" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export default function FtlQrCode({ uuid, imageUrl, size = 540 }: Props) {
  const { t } = useTrans();
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);

  const qrUrl = `https://hamrokarma.com/ftl/${uuid}`;

  const matrix = useMemo(() => {
    const qr = create(qrUrl, { errorCorrectionLevel: 'H' });
    return qr.modules;
  }, [qrUrl]);

  const totalModules = matrix.size + QUIET_ZONE * 2;
  const moduleSize = Math.floor(size / totalModules);
  const canvasSize = totalModules * moduleSize;

  const rects = useMemo(() => {
    const r: { x: number; y: number }[] = [];
    for (let row = 0; row < matrix.size; row++) {
      for (let col = 0; col < matrix.size; col++) {
        if (matrix.get(row, col)) {
          r.push({
            x: (col + QUIET_ZONE) * moduleSize,
            y: (row + QUIET_ZONE) * moduleSize,
          });
        }
      }
    }
    return r;
  }, [matrix, moduleSize]);

  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const logoHalf = LOGO_SIZE / 2;
  const logoX = cx - logoHalf;
  const logoY = cy - logoHalf;

  const handleDownload = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    setDownloading(true);
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(clone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = canvasSize;
        c.height = canvasSize;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const png = c.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `FTL-${uuid.slice(0, 8)}.png`;
        a.href = png;
        a.click();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }, [canvasSize, uuid]);

  const logoDataUri = useMemo(() => {
    const encoded = encodeURIComponent(FTL_LOGO_SVG)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        width={canvasSize}
        height={canvasSize}
        className="rounded-xl shadow-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <defs>
          <clipPath id="logoClip">
            <circle cx={cx} cy={cy} r={logoHalf} />
          </clipPath>
        </defs>

        <rect width={canvasSize} height={canvasSize} fill={BG} rx={20} />

        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={moduleSize} height={moduleSize} fill={FG} />
        ))}

        <circle cx={cx} cy={cy} r={logoHalf + 8} fill={BG} />
        <circle cx={cx} cy={cy} r={logoHalf + 5} fill="none" stroke={GOLD} strokeWidth={3.5} />
        <circle cx={cx} cy={cy} r={logoHalf + 3} fill="none" stroke={GOLD_LIGHT} strokeWidth={1} opacity={0.5} />

        {imageUrl ? (
          <image
            href={imageUrl}
            x={logoX}
            y={logoY}
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            clipPath="url(#logoClip)"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <image
            href={logoDataUri}
            x={logoX}
            y={logoY}
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        <rect x={5} y={5} width={canvasSize - 10} height={canvasSize - 10} rx={16}
          fill="none" stroke={GOLD} strokeWidth={2.5} />
        <rect x={9} y={9} width={canvasSize - 18} height={canvasSize - 18} rx={12}
          fill="none" stroke={GOLD_LIGHT} strokeWidth={1} strokeDasharray="6 4" opacity={0.7} />
      </svg>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {t('ftl.downloadQr')}
      </button>
    </div>
  );
}
