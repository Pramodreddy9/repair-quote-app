import {motion} from 'motion/react';
import type {CarPartId, PartId} from '../types/quote';

interface CarDiagramSVGProps {
  activePartId: CarPartId | null;
  addedPartIds: Set<PartId>;
  animationKey: number;
  prefersReducedMotion: boolean;
  onSelectPartHotspot: (partId: CarPartId) => void;
}

export function CarDiagramSVG({
  activePartId,
  addedPartIds,
  animationKey,
  prefersReducedMotion,
  onSelectPartHotspot,
}: CarDiagramSVGProps) {
  const isBatteryActive = activePartId === 'battery';
  const isFrontLeftTyreActive = activePartId === 'front-left-tyre';
  const isLeftHeadlightActive = activePartId === 'left-headlight';

  const hasBattery = addedPartIds.has('battery');
  const hasFrontLeftTyre = addedPartIds.has('front-left-tyre');
  const hasLeftHeadlight = addedPartIds.has('left-headlight');

  return (
    <svg
      viewBox="0 0 760 440"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Car front three-quarter diagram showing the car's left side, engine bay battery, front-left tyre, and left headlight"
    >
      <defs>
        <pattern
          id="car-grid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="#E5E9F0"
            strokeWidth="0.75"
          />
        </pattern>
        <linearGradient id="car-body-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="car-body-side" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="car-hood-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="car-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id="car-beam-grad" x1="100%" y1="50%" x2="0%" y2="70%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#FDE68A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Drafting background grid */}
      <rect x="0" y="0" width="760" height="440" fill="#FAFBFD" rx="12" />
      <rect x="16" y="16" width="728" height="408" fill="url(#car-grid)" rx="8" />

      {/* Ground perspective lines & vehicle shadow */}
      <line
        x1="56"
        y1="358"
        x2="684"
        y2="296"
        stroke="#CBD5E1"
        strokeWidth="1.25"
        strokeDasharray="6 4"
      />
      <polygon
        points="154,334 352,368 648,296 470,264"
        fill="#0F172A"
        fillOpacity="0.09"
      />

      {/* Orientation labels so left vs right side is unmistakable */}
      <text
        x="128"
        y="376"
        textAnchor="middle"
        className="fill-[#64748B] text-[11px]"
        style={{fontFamily: 'var(--font-mono)'}}
      >
        FRONT
      </text>
      <text
        x="568"
        y="336"
        textAnchor="middle"
        className="fill-[#475569] text-[11px] font-medium"
        style={{fontFamily: 'var(--font-mono)'}}
      >
        CAR’S LEFT SIDE (PASSENGER SIDE)
      </text>
      <line
        x1="462"
        y1="322"
        x2="674"
        y2="322"
        stroke="#CBD5E1"
        strokeWidth="1.2"
      />

      {/* ================= FAR-SIDE RIGHT WHEEL HINT (under front-right corner) ================= */}
      <ellipse cx="182" cy="316" rx="22" ry="26" fill="#1E293B" />

      {/* ================= REAR-LEFT WHEEL (cx=596, cy=272) ================= */}
      <g>
        <ellipse cx="596" cy="272" rx="30" ry="38" fill="#1E293B" />
        <ellipse cx="592" cy="272" rx="20" ry="27" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
        <ellipse cx="592" cy="272" rx="7" ry="10" fill="#475569" />
      </g>

      {/* ================= CAR BODY: LEFT FLANK, ROOF, GREENHOUSE ================= */}
      {/* Roof & C-pillar */}
      <path
        d="M 278 134 C 324 122, 466 118, 536 128 L 622 182 L 444 202 L 222 188 Z"
        fill="#1E40AF"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front windshield */}
      <path
        d="M 230 186 L 284 136 L 424 146 L 402 200 Z"
        fill="url(#car-glass-grad)"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Subtle windshield wiper hint */}
      <line x1="254" y1="186" x2="316" y2="176" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />

      {/* Left flank main body panel */}
      <path
        d="M 332 248 L 414 200 L 624 182 L 652 204 L 648 258 L 626 266 C 624 226, 566 226, 564 274 L 440 306 C 438 252, 358 252, 354 316 L 328 320 Z"
        fill="url(#car-body-side)"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Left side windows */}
      <path
        d="M 432 148 L 530 140 L 598 180 L 420 196 Z"
        fill="#334155"
        stroke="#1E3A8A"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* B-pillar */}
      <line x1="504" y1="142" x2="498" y2="190" stroke="#0F172A" strokeWidth="6" />
      {/* Door crease lines & handles */}
      <line x1="436" y1="234" x2="624" y2="206" stroke="#60A5FA" strokeWidth="1.5" strokeOpacity="0.65" />
      <rect x="492" y="218" width="16" height="4.5" rx="2" fill="#E2E8F0" />
      <rect x="562" y="208" width="15" height="4.5" rx="2" fill="#E2E8F0" />
      {/* Left side mirror (ORVM) */}
      <path
        d="M 426 196 L 406 188 L 402 200 L 424 206 Z"
        fill="#1E3A8A"
        stroke="#0F172A"
        strokeWidth="1.5"
      />

      {/* ================= FRONT FASCIA, GRILLE, BUMPER & RIGHT HEADLIGHT ================= */}
      {/* Front bumper & lower fascia */}
      <path
        d="M 142 238 L 156 222 L 336 244 L 332 320 L 180 314 C 148 310, 136 286, 142 238 Z"
        fill="url(#car-body-front)"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front grille */}
      <path
        d="M 176 248 L 264 258 L 252 292 L 178 282 Z"
        fill="#1E293B"
        stroke="#475569"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Grille slats */}
      <line x1="178" y1="260" x2="260" y2="269" stroke="#64748B" strokeWidth="1.5" />
      <line x1="179" y1="271" x2="255" y2="280" stroke="#64748B" strokeWidth="1.5" />
      {/* Center badge */}
      <ellipse cx="216" cy="264" rx="8" ry="5.5" fill="#CBD5E1" stroke="#334155" strokeWidth="1.2" />

      {/* Lower air dam & license plate */}
      <path
        d="M 172 294 L 266 304 L 260 317 L 172 308 Z"
        fill="#0F172A"
      />
      <rect
        x="194"
        y="296"
        width="44"
        height="13"
        rx="2"
        transform="rotate(6 216 302)"
        fill="#F8FAFC"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* Right Headlight (far side) */}
      <path
        d="M 146 232 L 176 238 L 168 256 L 143 248 Z"
        fill="#E2E8F0"
        stroke="#475569"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* ================= ENGINE BAY (REVEALED WHEN BATTERY IS ACTIVE) ================= */}
      <g>
        {/* Recessed engine bay floor */}
        <path
          d="M 162 222 L 230 186 L 406 200 L 332 246 Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Radiator core support bar */}
        <path d="M 170 222 L 328 242" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
        {/* Engine block & intake cover */}
        <path
          d="M 218 202 L 290 208 L 284 232 L 210 224 Z"
          fill="#475569"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <line x1="224" y1="210" x2="278" y2="215" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="220" y1="216" x2="276" y2="221" stroke="#CBD5E1" strokeWidth="2" />
        {/* Coolant cap */}
        <circle cx="204" cy="214" r="6" fill="#0284C7" stroke="#E0F2FE" strokeWidth="1" />

        {/* Battery Tray on front-left side of engine bay */}
        <path
          d="M 294 212 L 348 218 L 332 238 L 280 231 Z"
          fill="#0F172A"
          stroke={isBatteryActive ? '#EA580C' : '#64748B'}
          strokeWidth={isBatteryActive ? '2' : '1.5'}
        />

        {/* Battery unit sliding into place when battery is active */}
        {isBatteryActive && (
          prefersReducedMotion ? (
            <g>
              {/* 12V Battery seated statically */}
              <path
                d="M 296 200 L 344 205 L 344 226 L 330 237 L 284 231 L 284 210 Z"
                fill="#111827"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M 296 200 L 344 205 L 330 216 L 284 210 Z"
                fill="#2563EB"
              />
              {/* + and - terminals */}
              <circle cx="300" cy="206" r="3" fill="#DC2626" />
              <circle cx="326" cy="209" r="3" fill="#94A3B8" />
            </g>
          ) : (
            <motion.g
              key={`car-battery-anim-${animationKey}`}
              initial={{y: -58, opacity: 0}}
              animate={{y: 0, opacity: 1}}
              transition={{delay: 0.25, duration: 0.65, ease: [0.16, 1, 0.3, 1]}}
            >
              {/* 12V Battery */}
              <path
                d="M 296 200 L 344 205 L 344 226 L 330 237 L 284 231 L 284 210 Z"
                fill="#111827"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M 296 200 L 344 205 L 330 216 L 284 210 Z"
                fill="#2563EB"
              />
              <circle cx="300" cy="206" r="3.2" fill="#EF4444" />
              <circle cx="326" cy="209" r="3.2" fill="#CBD5E1" />
              {/* Downward placement arrow */}
              <path
                d="M 314 176 L 314 194 M 309 189 L 314 195 L 319 189"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          )
        )}
      </g>

      {/* ================= BONNET / HOOD (OPENS WHEN BATTERY IS ACTIVE) ================= */}
      <g
        onClick={() => hasBattery && onSelectPartHotspot('battery')}
        className={hasBattery ? 'cursor-pointer' : undefined}
      >
        {isBatteryActive ? (
          prefersReducedMotion ? (
            <g>
              {/* Hood prop strut */}
              <line x1="336" y1="234" x2="318" y2="148" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
              {/* Open bonnet static */}
              <path
                d="M 228 185 L 404 199 L 344 128 L 194 114 Z"
                fill="url(#car-hood-grad)"
                fillOpacity="0.92"
                stroke="#1E3A8A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Highlight box around engine bay */}
              <ellipse
                cx="314"
                cy="218"
                rx="46"
                ry="28"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeDasharray="6 4"
              />
            </g>
          ) : (
            <g key={`car-hood-anim-${animationKey}`}>
              {/* Hood prop strut */}
              <motion.line
                x1="336"
                y1="234"
                x2="318"
                y2="148"
                stroke="#94A3B8"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.18, duration: 0.25}}
              />
              {/* Hinged bonnet lifting open from rear hinge edge */}
              <motion.path
                d="M 156 222 L 230 186 L 406 200 L 336 244 Z"
                fill="url(#car-hood-grad)"
                fillOpacity="0.94"
                stroke="#1E3A8A"
                strokeWidth="2"
                strokeLinejoin="round"
                style={{transformOrigin: '318px 193px'}}
                initial={{rotate: 0, scaleY: 1, y: 0}}
                animate={{rotate: 12, scaleY: 0.72, y: -62}}
                transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              />
              <ellipse
                cx="314"
                cy="218"
                rx="46"
                ry="28"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeDasharray="6 4"
              />
            </g>
          )
        ) : (
          /* Closed bonnet */
          <g>
            <path
              d="M 156 222 L 230 186 L 406 200 L 336 244 Z"
              fill="url(#car-hood-grad)"
              stroke="#1E3A8A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="205" y1="224" x2="262" y2="193" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="286" y1="234" x2="344" y2="200" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.65" />
            {hasBattery && (
              <ellipse
                cx="312"
                cy="216"
                rx="42"
                ry="22"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
            )}
          </g>
        )}
      </g>

      {/* ================= LEFT HEADLIGHT (FOREGROUND LEFT CORNER) ================= */}
      <g
        onClick={() => hasLeftHeadlight && onSelectPartHotspot('left-headlight')}
        className={hasLeftHeadlight ? 'cursor-pointer' : undefined}
      >
        {/* Left headlamp pocket */}
        <path
          d="M 272 246 L 336 244 L 326 266 L 266 266 Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Left headlamp lens */}
        <path
          d="M 274 248 L 332 246 L 324 264 L 270 264 Z"
          fill={isLeftHeadlightActive ? '#FEF08A' : '#E2E8F0'}
          stroke="#475569"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* DRL LED bar */}
        <line x1="274" y1="261" x2="322" y2="261" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

        {isLeftHeadlightActive && (
          prefersReducedMotion ? (
            <g>
              <polygon
                points="270,250 112,286 128,332 272,265"
                fill="url(#car-beam-grad)"
              />
              <ellipse
                cx="301"
                cy="255"
                rx="42"
                ry="22"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            </g>
          ) : (
            <g key={`car-headlight-anim-${animationKey}`}>
              <ellipse
                cx="301"
                cy="255"
                rx="42"
                ry="22"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <motion.g
                initial={{x: -36, y: 14, opacity: 0}}
                animate={{x: 0, y: 0, opacity: 1}}
                transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
              >
                <path
                  d="M 274 248 L 332 246 L 324 264 L 270 264 Z"
                  fill="#FDE047"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="298" cy="255" r="5" fill="#FFFFFF" />
              </motion.g>
              <motion.polygon
                points="270,250 108,288 126,336 272,265"
                fill="url(#car-beam-grad)"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.42, duration: 0.35}}
              />
            </g>
          )
        )}

        {hasLeftHeadlight && !isLeftHeadlightActive && (
          <ellipse
            cx="301"
            cy="255"
            rx="38"
            ry="19"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
          />
        )}
      </g>

      {/* ================= FRONT-LEFT WHEEL & TYRE (cx=396, cy=312) ================= */}
      <g
        onClick={() => hasFrontLeftTyre && onSelectPartHotspot('front-left-tyre')}
        className={hasFrontLeftTyre ? 'cursor-pointer' : undefined}
      >
        {/* Tyre sidewall */}
        <ellipse cx="396" cy="312" rx="42" ry="52" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
        {/* 3/4 tyre tread band */}
        <ellipse
          cx="393"
          cy="312"
          rx="39"
          ry="49"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeDasharray="6 6"
        />
        {/* Alloy wheel rim */}
        <ellipse cx="390" cy="312" rx="28" ry="37" fill="#E2E8F0" stroke="#64748B" strokeWidth="2.5" />
        {/* 5 alloy spokes */}
        {[0, 72, 144, 216, 288].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = 390 + Math.cos(rad) * 24;
          const y2 = 312 + Math.sin(rad) * 32;
          return (
            <line
              key={angle}
              x1="390"
              y1="312"
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          );
        })}
        <ellipse cx="390" cy="312" rx="9" ry="12" fill="#475569" stroke="#CBD5E1" strokeWidth="1.5" />

        {isFrontLeftTyreActive && (
          prefersReducedMotion ? (
            <g>
              <ellipse
                cx="396"
                cy="312"
                rx="52"
                ry="62"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="7 5"
              />
            </g>
          ) : (
            <motion.g
              key={`car-fl-tyre-anim-${animationKey}`}
              initial={{x: -46, y: 18, opacity: 0.25}}
              animate={{x: 0, y: 0, opacity: 1}}
              transition={{duration: 0.65, ease: [0.16, 1, 0.3, 1]}}
            >
              <ellipse
                cx="396"
                cy="312"
                rx="43"
                ry="53"
                fill="none"
                stroke="#EA580C"
                strokeWidth="4"
              />
              <ellipse
                cx="396"
                cy="312"
                rx="52"
                ry="62"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeDasharray="7 5"
              />
            </motion.g>
          )
        )}

        {hasFrontLeftTyre && !isFrontLeftTyreActive && (
          <ellipse
            cx="396"
            cy="312"
            rx="48"
            ry="58"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />
        )}
      </g>

      {/* ================= ACTIVE CALLOUT CARDS ================= */}
      {isBatteryActive && (
        <g>
          <polyline
            points="336,204 416,82 466,82"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="336" cy="204" r="4" fill="#EA580C" />
          <rect
            x="466"
            y="56"
            width="244"
            height="50"
            rx="8"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="1.8"
          />
          <text
            x="478"
            y="77"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Battery · Engine bay revealed
          </text>
          <text x="478" y="94" className="fill-[#64748B] text-[10.5px]">
            {prefersReducedMotion
              ? 'Static highlight · Battery seated in tray'
              : 'Bonnet lifted · Battery sliding into tray'}
          </text>
        </g>
      )}

      {isFrontLeftTyreActive && (
        <g>
          <polyline
            points="446,326 492,386 520,386"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="446" cy="326" r="4" fill="#EA580C" />
          <rect
            x="520"
            y="366"
            width="210"
            height="46"
            rx="8"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="1.8"
          />
          <text
            x="532"
            y="386"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Front-left tyre
          </text>
          <text x="532" y="401" className="fill-[#64748B] text-[10.5px]">
            {prefersReducedMotion
              ? 'Static highlight · Car’s left front wheel'
              : 'New tyre fitted on front-left hub'}
          </text>
        </g>
      )}

      {isLeftHeadlightActive && (
        <g>
          <polyline
            points="272,240 184,116 146,116"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="272" cy="240" r="4" fill="#EA580C" />
          <rect
            x="28"
            y="92"
            width="200"
            height="46"
            rx="8"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="1.8"
          />
          <text
            x="40"
            y="112"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Left headlight
          </text>
          <text x="40" y="127" className="fill-[#64748B] text-[10.5px]">
            {prefersReducedMotion
              ? 'Static highlight · Front-left lamp'
              : 'Replacement headlamp fitted on left'}
          </text>
        </g>
      )}
    </svg>
  );
}
