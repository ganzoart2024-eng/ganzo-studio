import React from 'react';
import { ORDER_STATUSES, type OrderStatus, type PortfolioItem } from '../types/studio';

interface ApparelMockupProps {
  productName: string;
  colorHex: string;
  printText?: string;
  uploadedLogoUrl?: string | null;
  placement?: 'front' | 'back';
  printMethod?: string;
}

export const ApparelMockup: React.FC<ApparelMockupProps> = ({
  productName,
  colorHex,
  printText = 'GANZO',
  uploadedLogoUrl,
  placement = 'front',
  printMethod = 'DTF Print',
}) => {
  const isLight =
    colorHex.toUpperCase() === '#FFFFFF' ||
    colorHex.toUpperCase() === '#F4F4F4' ||
    colorHex.toUpperCase() === '#E4E4E7' ||
    colorHex.toUpperCase() === '#00FFFF';
  const strokeColor = isLight ? '#111111' : '#3F3F46';
  const inkColor = isLight ? '#111111' : '#FFFFFF';
  const accentColor = colorHex.toUpperCase() === '#00FFFF' ? '#111111' : '#00FFFF';
  const lower = productName.toLowerCase();
  const isHoodie = lower.includes('hoodie') || lower.includes('sweat');
  const isCap = lower.includes('cap') || lower.includes('headwear');
  const isPants = lower.includes('pant') || lower.includes('jogger');

  return (
    <div className="relative flex flex-col items-center justify-center bg-[#F4F4F4] border border-neutral-200 p-6 min-h-[340px]">
      <div className="w-full flex items-center justify-between text-xs font-mono text-neutral-500 mb-3">
        <span>{placement === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}</span>
        <span>{printMethod}</span>
      </div>

      <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center">
        {isCap ? (
          <svg viewBox="0 0 260 220" className="w-full h-full drop-shadow-sm">
            <path
              d="M52 132 C52 68, 208 68, 208 132 L212 146 C175 152, 92 152, 48 146 Z"
              fill={colorHex}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <path
              d="M48 146 C95 162, 185 162, 232 154 C215 174, 108 182, 48 156 Z"
              fill={colorHex}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <path d="M130 82 L130 148" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            {!uploadedLogoUrl && (
              <g transform="translate(130, 118)">
                <rect x="-26" y="-12" width="52" height="24" fill="none" stroke={accentColor} strokeWidth="1.5" />
                <text
                  textAnchor="middle"
                  y="4"
                  fill={inkColor}
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  letterSpacing="2"
                >
                  {printText.slice(0, 8).toUpperCase()}
                </text>
              </g>
            )}
          </svg>
        ) : isPants ? (
          <svg viewBox="0 0 260 260" className="w-full h-full">
            <path
              d="M78 24 L182 24 L196 234 L148 234 L130 112 L112 234 L64 234 Z"
              fill={colorHex}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <line x1="78" y1="42" x2="182" y2="42" stroke={strokeColor} strokeWidth="1.5" />
            {!uploadedLogoUrl && (
              <text
                x="96"
                y="120"
                fill={accentColor}
                fontSize="10"
                fontWeight="700"
                fontFamily="Bricolage Grotesque, sans-serif"
                letterSpacing="1.5"
              >
                {printText.slice(0, 7).toUpperCase()}
              </text>
            )}
          </svg>
        ) : (
          <svg viewBox="0 0 260 260" className="w-full h-full">
            {isHoodie && (
              <path
                d="M96 42 C96 18, 164 18, 164 42 L154 60 L106 60 Z"
                fill={colorHex}
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            )}
            <path
              d="M66 56 L102 44 Q130 62 158 44 L194 56 L232 104 L204 126 L184 102 L184 236 L76 236 L76 102 L56 126 L28 104 Z"
              fill={colorHex}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {lower.includes('polo') && (
              <path d="M112 46 L130 74 L148 46" fill="none" stroke={strokeColor} strokeWidth="2" />
            )}
            {isHoodie && (
              <path
                d="M92 162 L168 162 L174 214 L86 214 Z"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                opacity="0.7"
              />
            )}
            {!uploadedLogoUrl && (
              <g transform={placement === 'front' ? 'translate(130, 118)' : 'translate(130, 124)'}>
                <rect
                  x="-38"
                  y="-22"
                  width="76"
                  height="44"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text
                  textAnchor="middle"
                  y="-2"
                  fill={inkColor}
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  letterSpacing="2"
                >
                  {printText.slice(0, 10).toUpperCase()}
                </text>
                <text
                  textAnchor="middle"
                  y="14"
                  fill={accentColor}
                  fontSize="7"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="1.5"
                >
                  STUDIO EDITION
                </text>
              </g>
            )}
          </svg>
        )}

        {uploadedLogoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src={uploadedLogoUrl}
              alt="Customer artwork preview on garment"
              referrerPolicy="no-referrer"
              className="w-20 h-20 object-contain bg-white/85 p-1 border border-neutral-300"
            />
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-200">
        <span className="font-medium text-[#111111] truncate">{productName}</span>
        <span className="font-mono text-[11px] text-neutral-500">{colorHex.toUpperCase()}</span>
      </div>
    </div>
  );
};

interface PaperMockupProps {
  productName: string;
  format: string;
  paperType: string;
  finish: string;
  brandTitle?: string;
  uploadedArtUrl?: string | null;
}

export const PaperMockup: React.FC<PaperMockupProps> = ({
  productName,
  format,
  paperType,
  finish,
  brandTitle = 'GANZO CLIENT',
  uploadedArtUrl,
}) => {
  const hasFoil = finish.toLowerCase().includes('foil') || finish.toLowerCase().includes('uv');
  return (
    <div className="bg-[#F4F4F4] border border-neutral-200 p-6 flex flex-col justify-between min-h-[340px]">
      <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-4">
        <span>PRE-PRESS SPECIMEN</span>
        <span>{format}</span>
      </div>

      <div className="relative flex-1 flex items-center justify-center py-4">
        {/* Back Sheet */}
        <div className="w-56 h-36 bg-[#111111] text-white p-5 transform -rotate-3 translate-x-4 translate-y-3 border border-[#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#00FFFF]">BACK / VERSO</span>
            {hasFoil && <span className="w-3 h-3 bg-[#00FFFF]" />}
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-tight">{brandTitle}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Tunis · Custom Print Run</p>
          </div>
        </div>

        {/* Front Sheet */}
        <div className="absolute w-56 h-36 bg-white border border-[#111111] p-5 transform rotate-1 -translate-x-4 -translate-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">{productName.slice(0, 18)}</span>
            <span className="w-2.5 h-2.5 bg-[#00FFFF] shrink-0" />
          </div>
          {uploadedArtUrl ? (
            <img
              src={uploadedArtUrl}
              alt="Uploaded print artwork"
              referrerPolicy="no-referrer"
              className="h-14 w-auto object-contain self-start"
            />
          ) : (
            <div>
              <p className="font-display text-lg font-bold text-[#111111] leading-none">{brandTitle}</p>
              <p className="text-[10px] font-mono text-neutral-500 mt-2">3MM BLEED · CMYK READY</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 gap-3">
        <span className="truncate font-medium text-[#111111]">{paperType}</span>
        <span className="font-mono text-[11px] text-neutral-500 shrink-0">{finish}</span>
      </div>
    </div>
  );
};

export const PortfolioVisual: React.FC<{ item: PortfolioItem }> = ({ item }) => {
  return (
    <div className="relative aspect-[4/3] bg-[#111111] text-white p-6 flex flex-col justify-between overflow-hidden border border-neutral-800">
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <span>{item.client.toUpperCase()}</span>
        <span className="text-[#00FFFF]">{item.year}</span>
      </div>

      {item.mockupType === 'apparel' && (
        <div className="my-auto flex items-center justify-center">
          <svg viewBox="0 0 180 150" className="w-36 h-30">
            <path
              d="M42 26 L68 18 Q90 30 112 18 L138 26 L164 60 L144 74 L132 58 L132 138 L48 138 L48 58 L36 74 L16 60 Z"
              fill="#1E1E22"
              stroke="#00FFFF"
              strokeWidth="1.5"
            />
            <text
              x="90"
              y="78"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="700"
              fontFamily="Bricolage Grotesque, sans-serif"
              letterSpacing="1.5"
            >
              {item.client.split(' ')[0].toUpperCase()}
            </text>
            <line x1="66" y1="86" x2="114" y2="86" stroke="#00FFFF" strokeWidth="2" />
          </svg>
        </div>
      )}

      {item.mockupType === 'print' && (
        <div className="my-auto flex items-center justify-center gap-3">
          <div className="w-24 h-32 bg-white text-[#111111] p-3 flex flex-col justify-between">
            <div className="w-6 h-1 bg-[#00FFFF]" />
            <div className="font-display text-xs font-bold leading-tight">{item.client}</div>
            <div className="text-[8px] font-mono text-neutral-500">350G MATTE</div>
          </div>
          <div className="w-24 h-32 bg-[#1B1B1F] border border-neutral-700 p-3 flex flex-col justify-between translate-y-2">
            <div className="text-[8px] font-mono text-[#00FFFF]">EDITION</div>
            <div className="w-10 h-10 border border-white/40" />
          </div>
        </div>
      )}

      {item.mockupType === 'packaging' && (
        <div className="my-auto flex items-center justify-center">
          <div className="relative w-32 h-28 bg-white text-[#111111] p-4 flex flex-col justify-between border-b-4 border-[#00FFFF]">
            <span className="text-[9px] font-mono text-neutral-500">PACKAGING SKU</span>
            <span className="font-display text-sm font-bold leading-tight">{item.client}</span>
            <div className="flex gap-1">
              {item.palette.map((c, idx) => (
                <span key={idx} className="w-4 h-1.5" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {item.mockupType === 'identity' && (
        <div className="my-auto flex items-center justify-center">
          <div className="w-44 h-28 border border-neutral-700 p-4 flex flex-col justify-between bg-[#161619]">
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 bg-[#00FFFF]" />
              <span className="text-[9px] font-mono text-neutral-400">BRAND SYSTEM</span>
            </div>
            <div className="font-display text-base font-bold tracking-tight">{item.client}</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800 pt-3">
        <span>{item.category}</span>
        <span className="font-mono text-white">GANZO STUDIO</span>
      </div>
    </div>
  );
};

export const OrderPipelineTracker: React.FC<{ currentStatus: OrderStatus }> = ({ currentStatus }) => {
  const currentIdx = ORDER_STATUSES.indexOf(currentStatus);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {ORDER_STATUSES.map((step, idx) => {
        const completed = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div
            key={step}
            className={`p-3 border transition-colors ${
              active
                ? 'bg-[#111111] text-white border-[#111111]'
                : completed
                  ? 'bg-[#F4F4F4] text-[#111111] border-neutral-300'
                  : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
              {active && <span className="w-2 h-2 bg-[#00FFFF]" />}
              {completed && <span className="text-[#007A87] font-bold">OK</span>}
            </div>
            <div className="text-xs font-semibold leading-snug">{step}</div>
          </div>
        );
      })}
    </div>
  );
};
