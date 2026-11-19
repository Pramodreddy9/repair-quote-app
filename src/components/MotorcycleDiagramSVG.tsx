import {motion} from 'motion/react';
import type {MotorcyclePartId, PartId} from '../types/quote';

interface MotorcycleDiagramSVGProps {
  activePartId: MotorcyclePartId | null;
  addedPartIds: Set<PartId>;
  animationKey: number;
  prefersReducedMotion: boolean;
  onSelectPartHotspot: (partId: MotorcyclePartId) => void;
}

export function MotorcycleDiagramSVG({
  activePartId,
  addedPartIds,
  animationKey,
  prefersReducedMotion,
  onSelectPartHotspot,
}: MotorcycleDiagramSVGProps) {
  const isBrakePadsActive = activePartId === 'front-brake-pads';
  const isRearTyreActive = activePartId === 'rear-tyre';
  const isHeadlightActive = activePartId === 'headlight';

  const hasBrakePads = addedPartIds.has('front-brake-pads');
  const hasRearTyre = addedPartIds.has('rear-tyre');
  const hasHeadlight = addedPartIds.has('headlight');

  return (
    <svg
      viewBox="0 0 760 440"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Motorcycle side profile diagram highlighting front brake pads, rear tyre, and headlight"
    >
      <defs>
        <pattern
          id="moto-grid"
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
        <linearGradient id="moto-tank-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="moto-metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="moto-beam-grad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#FDE68A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Drafting background grid */}
      <rect x="0" y="0" width="760" height="440" fill="#FAFBFD" rx="12" />
      <rect x="16" y="16" width="728" height="408" fill="url(#moto-grid)" rx="8" />

      {/* Ground baseline & subtle contact shadows */}
      <line
        x1="48"
        y1="376"
        x2="712"
        y2="376"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <ellipse cx="170" cy="378" rx="76" ry="7" fill="#0F172A" fillOpacity="0.08" />
      <ellipse cx="520" cy="378" rx="76" ry="7" fill="#0F172A" fillOpacity="0.08" />

      {/* Orientation labels */}
      <text
        x="170"
        y="404"
        textAnchor="middle"
        className="fill-[#64748B] text-[11px]"
        style={{fontFamily: 'var(--font-mono)'}}
      >
        REAR
      </text>
      <text
        x="520"
        y="404"
        textAnchor="middle"
        className="fill-[#64748B] text-[11px]"
        style={{fontFamily: 'var(--font-mono)'}}
      >
        FRONT
      </text>

      {/* ================= REAR WHEEL (cx=170, cy=300) ================= */}
      <g
        onClick={() => hasRearTyre && onSelectPartHotspot('rear-tyre')}
        className={hasRearTyre ? 'cursor-pointer' : undefined}
      >
        {/* Base rear tyre */}
        <circle
          cx="170"
          cy="300"
          r="63"
          fill="none"
          stroke="#1E293B"
          strokeWidth="24"
        />
        {/* Subtle tyre tread notches */}
        <circle
          cx="170"
          cy="300"
          r="74"
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
          strokeDasharray="6 8"
        />
        {/* Rear rim */}
        <circle
          cx="170"
          cy="300"
          r="49"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="4"
        />
        <circle
          cx="170"
          cy="300"
          r="44"
          fill="#F8FAFC"
          fillOpacity="0.2"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Alloy spokes */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = 170 + Math.cos(rad) * 46;
          const y2 = 300 + Math.sin(rad) * 46;
          return (
            <line
              key={angle}
              x1="170"
              y1="300"
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          );
        })}
        {/* Rear sprocket & hub */}
        <circle cx="170" cy="300" r="18" fill="#64748B" stroke="#334155" strokeWidth="2" />
        <circle cx="170" cy="300" r="8" fill="#CBD5E1" stroke="#334155" strokeWidth="1.5" />

        {/* Rear tyre replacement animation / static highlight */}
        {isRearTyreActive && (
          prefersReducedMotion ? (
            <g>
              <circle
                cx="170"
                cy="300"
                r="63"
                fill="none"
                stroke="#EA580C"
                strokeWidth="24"
                strokeOpacity="0.28"
              />
              <circle
                cx="170"
                cy="300"
                r="82"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="7 5"
              />
            </g>
          ) : (
            <motion.g
              key={`rear-tyre-anim-${animationKey}`}
              initial={{x: -44, y: -40, opacity: 0.2, rotate: -24}}
              animate={{x: 0, y: 0, opacity: 1, rotate: 0}}
              transition={{duration: 0.65, ease: [0.16, 1, 0.3, 1]}}
              style={{transformOrigin: '170px 300px'}}
            >
              <circle
                cx="170"
                cy="300"
                r="63"
                fill="none"
                stroke="#0F172A"
                strokeWidth="24"
              />
              <circle
                cx="170"
                cy="300"
                r="75"
                fill="none"
                stroke="#EA580C"
                strokeWidth="3.5"
                strokeDasharray="8 6"
              />
              <circle
                cx="170"
                cy="300"
                r="51"
                fill="none"
                stroke="#F97316"
                strokeWidth="2"
              />
            </motion.g>
          )
        )}
      </g>

      {/* ================= REAR FENDER, SWINGARM & SHOCK ================= */}
      {/* Rear mudguard */}
      <path
        d="M 104 252 C 118 214, 178 205, 224 228"
        fill="none"
        stroke="#334155"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Tail lamp */}
      <path d="M 114 205 L 136 198 L 138 214 L 116 218 Z" fill="#DC2626" />
      {/* Rear suspension spring */}
      <line x1="256" y1="210" x2="218" y2="288" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      <line
        x1="252"
        y1="218"
        x2="224"
        y2="276"
        stroke="#94A3B8"
        strokeWidth="9"
        strokeDasharray="4 4"
      />
      {/* Swingarm */}
      <path
        d="M 170 300 L 296 290 L 296 299 L 170 307 Z"
        fill="#64748B"
        stroke="#334155"
        strokeWidth="1.5"
      />
      {/* Drive chain line */}
      <line x1="170" y1="284" x2="296" y2="278" stroke="#334155" strokeWidth="2.5" strokeDasharray="4 3" />
      <line x1="170" y1="316" x2="296" y2="306" stroke="#334155" strokeWidth="2.5" strokeDasharray="4 3" />

      {/* ================= ENGINE, FRAME & EXHAUST ================= */}
      {/* Frame downtubes */}
      <path
        d="M 432 146 L 408 215 L 368 292 L 296 292 L 254 206 L 312 192"
        fill="none"
        stroke="#334155"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Engine cylinder & crankcase */}
      <rect
        x="306"
        y="214"
        width="86"
        height="76"
        rx="12"
        fill="url(#moto-metal-grad)"
        stroke="#475569"
        strokeWidth="2"
      />
      {/* Cooling fins */}
      {[224, 232, 240, 248].map((yPos) => (
        <line
          key={yPos}
          x1="314"
          y1={yPos}
          x2="384"
          y2={yPos}
          stroke="#475569"
          strokeWidth="2"
        />
      ))}
      {/* Clutch cover */}
      <circle cx="344" cy="272" r="20" fill="#64748B" stroke="#334155" strokeWidth="2" />
      <circle cx="344" cy="272" r="8" fill="#94A3B8" />

      {/* Exhaust header & muffler */}
      <path
        d="M 392 238 C 420 245, 422 308, 378 320 L 265 320 L 146 286 L 146 270 L 270 304 L 372 304"
        fill="#94A3B8"
        stroke="#334155"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="144"
        y="272"
        width="104"
        height="22"
        rx="7"
        transform="rotate(14 196 283)"
        fill="#475569"
        stroke="#1E293B"
        strokeWidth="2"
      />

      {/* ================= SEAT & FUEL TANK ================= */}
      {/* Side panel */}
      <path
        d="M 244 204 L 314 192 L 308 242 L 240 236 Z"
        fill="#1E293B"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      {/* Rider & pillion seat */}
      <path
        d="M 142 182 C 184 180, 238 188, 288 182 C 304 180, 314 196, 304 204 L 144 202 C 134 202, 132 184, 142 182 Z"
        fill="#1E293B"
        stroke="#0F172A"
        strokeWidth="2"
      />
      {/* Sculpted fuel tank */}
      <path
        d="M 300 188 C 296 154, 336 128, 392 132 C 418 134, 434 150, 428 176 C 422 192, 396 196, 356 198 C 328 200, 304 198, 300 188 Z"
        fill="url(#moto-tank-grad)"
        stroke="#1E3A8A"
        strokeWidth="2"
      />
      {/* Tank knee recess & fuel cap */}
      <path
        d="M 332 162 C 356 154, 392 158, 412 170"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="378" cy="133" rx="10" ry="3.5" fill="#CBD5E1" stroke="#334155" strokeWidth="1.5" />

      {/* ================= FRONT FORKS, HANDLEBAR, FENDER ================= */}
      {/* Handlebar & mirror */}
      <path
        d="M 432 134 L 414 106 L 386 104"
        fill="none"
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="374" y="99" width="22" height="9" rx="4" fill="#0F172A" />
      <line x1="416" y1="106" x2="404" y2="74" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="394" cy="70" rx="14" ry="7" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />

      {/* Front fender */}
      <path
        d="M 454 240 C 482 212, 540 210, 574 238"
        fill="none"
        stroke="#1E40AF"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Front telescopic fork */}
      <line x1="432" y1="138" x2="520" y2="300" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />
      <line x1="432" y1="138" x2="482" y2="230" stroke="#475569" strokeWidth="13" strokeLinecap="round" />

      {/* ================= FRONT WHEEL & DISC BRAKE (cx=520, cy=300) ================= */}
      <g
        onClick={() => hasBrakePads && onSelectPartHotspot('front-brake-pads')}
        className={hasBrakePads ? 'cursor-pointer' : undefined}
      >
        {/* Front tyre */}
        <circle
          cx="520"
          cy="300"
          r="63"
          fill="none"
          stroke="#1E293B"
          strokeWidth="22"
        />
        <circle
          cx="520"
          cy="300"
          r="74"
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
          strokeDasharray="6 8"
        />
        {/* Front rim */}
        <circle
          cx="520"
          cy="300"
          r="50"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="4"
        />
        {/* Front alloy spokes */}
        {[30, 90, 150, 210, 270, 330].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = 520 + Math.cos(rad) * 47;
          const y2 = 300 + Math.sin(rad) * 47;
          return (
            <line
              key={angle}
              x1="520"
              y1="300"
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Perforated Front Brake Disc Rotor */}
        <circle
          cx="520"
          cy="300"
          r="33"
          fill="#E2E8F0"
          fillOpacity="0.65"
          stroke="#64748B"
          strokeWidth="2.5"
        />
        <circle
          cx="520"
          cy="300"
          r="25"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeDasharray="2 5"
        />
        <circle cx="520" cy="300" r="14" fill="#64748B" stroke="#334155" strokeWidth="2" />
        <circle cx="520" cy="300" r="6" fill="#CBD5E1" />

        {/* Front Brake Caliper mounted on fork leg */}
        <path
          d="M 484 268 L 502 260 L 510 282 L 490 290 Z"
          fill={isBrakePadsActive ? '#EA580C' : '#334155'}
          stroke="#0F172A"
          strokeWidth="1.8"
        />

        {/* Front wheel highlight when front brake pads active */}
        {isBrakePadsActive && (
          <g>
            <circle
              cx="520"
              cy="300"
              r="82"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeDasharray="7 5"
            />
            <circle
              cx="497"
              cy="275"
              r="20"
              fill="#EA580C"
              fillOpacity="0.16"
              stroke="#EA580C"
              strokeWidth="2"
            />
          </g>
        )}
      </g>

      {/* ================= FRONT HEADLIGHT (x=456..498, y=126..170) ================= */}
      <g
        onClick={() => hasHeadlight && onSelectPartHotspot('headlight')}
        className={hasHeadlight ? 'cursor-pointer' : undefined}
      >
        {/* Headlamp housing shell */}
        <path
          d="M 442 134 C 454 126, 474 126, 484 134 L 484 168 C 472 174, 454 174, 442 166 Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Headlamp lens */}
        <ellipse
          cx="484"
          cy="151"
          rx="8"
          ry="18"
          fill={isHeadlightActive ? '#FEF08A' : '#E2E8F0'}
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Headlight animation / static highlight */}
        {isHeadlightActive && (
          prefersReducedMotion ? (
            <g>
              <polygon
                points="492,138 628,108 628,194 492,164"
                fill="url(#moto-beam-grad)"
              />
              <circle
                cx="470"
                cy="151"
                r="32"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            </g>
          ) : (
            <g key={`moto-headlight-anim-${animationKey}`}>
              {/* Subtle highlight reticle around headlamp */}
              <circle
                cx="470"
                cy="151"
                r="32"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              {/* Sliding replacement lamp module */}
              <motion.g
                initial={{x: 42, opacity: 0}}
                animate={{x: 0, opacity: 1}}
                transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
              >
                <ellipse
                  cx="485"
                  cy="151"
                  rx="8.5"
                  ry="18"
                  fill="#FDE047"
                  stroke="#EA580C"
                  strokeWidth="2"
                />
                <circle cx="484" cy="151" r="4.5" fill="#FFFFFF" />
              </motion.g>
              {/* Beam glow fades in after lamp seats */}
              <motion.polygon
                points="492,138 634,106 634,196 492,164"
                fill="url(#moto-beam-grad)"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.42, duration: 0.35}}
              />
            </g>
          )
        )}
      </g>

      {/* ================= SUBTLE INDICATORS FOR OTHER QUOTED PARTS ================= */}
      {hasRearTyre && !isRearTyreActive && (
        <circle
          cx="170"
          cy="300"
          r="79"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeOpacity="0.6"
        />
      )}
      {hasBrakePads && !isBrakePadsActive && (
        <circle
          cx="497"
          cy="275"
          r="16"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeOpacity="0.7"
        />
      )}
      {hasHeadlight && !isHeadlightActive && (
        <circle
          cx="470"
          cy="151"
          r="28"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeOpacity="0.7"
        />
      )}

      {/* ================= CLOSE-UP INSET: FRONT BRAKE PADS SLIDING TOWARD DISC ================= */}
      {isBrakePadsActive && (
        <g>
          {/* Leader line from caliper to close-up box */}
          <polyline
            points="512,268 564,210 564,178"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="512" cy="268" r="4" fill="#EA580C" />

          {/* Inset card */}
          <rect
            x="528"
            y="24"
            width="210"
            height="154"
            rx="10"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="2"
          />
          <text
            x="542"
            y="45"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Front brake caliper close-up
          </text>
          <text
            x="542"
            y="60"
            className="fill-[#64748B] text-[10.5px]"
            style={{fontFamily: 'var(--font-sans)'}}
          >
            {prefersReducedMotion
              ? 'Static preview: pads beside front disc'
              : 'New pads sliding toward front disc'}
          </text>

          {/* Caliper bridge housing background */}
          <path
            d="M 564 76 L 702 76 L 702 150 L 682 150 L 682 94 L 584 94 L 584 150 L 564 150 Z"
            fill="#F1F5F9"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Center Brake Disc Rotor (cross-section) */}
          <rect
            x="626"
            y="78"
            width="14"
            height="80"
            rx="2"
            fill="#94A3B8"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Ventilation slots on disc */}
          <line x1="633" y1="88" x2="633" y2="148" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />

          {/* Left & Right Brake Pads */}
          {prefersReducedMotion ? (
            <g>
              {/* Static Left Pad */}
              <g transform="translate(-4, 0)">
                <rect x="606" y="96" width="7" height="44" rx="1.5" fill="#1E293B" />
                <rect x="613" y="98" width="11" height="40" rx="1.5" fill="#EA580C" />
              </g>
              {/* Static Right Pad */}
              <g transform="translate(4, 0)">
                <rect x="653" y="96" width="7" height="44" rx="1.5" fill="#1E293B" />
                <rect x="642" y="98" width="11" height="40" rx="1.5" fill="#EA580C" />
              </g>
            </g>
          ) : (
            <g key={`pads-closeup-anim-${animationKey}`}>
              {/* Left Pad sliding right toward disc */}
              <motion.g
                initial={{x: -24, opacity: 0.35}}
                animate={{x: -3, opacity: 1}}
                transition={{duration: 0.75, ease: [0.16, 1, 0.3, 1]}}
              >
                <rect x="606" y="96" width="7" height="44" rx="1.5" fill="#1E293B" />
                <rect x="613" y="98" width="11" height="40" rx="1.5" fill="#EA580C" />
                {/* Slide arrow */}
                <path
                  d="M 588 118 L 601 118 M 597 114 L 602 118 L 597 122"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>

              {/* Right Pad sliding left toward disc */}
              <motion.g
                initial={{x: 24, opacity: 0.35}}
                animate={{x: 3, opacity: 1}}
                transition={{duration: 0.75, ease: [0.16, 1, 0.3, 1]}}
              >
                <rect x="653" y="96" width="7" height="44" rx="1.5" fill="#1E293B" />
                <rect x="642" y="98" width="11" height="40" rx="1.5" fill="#EA580C" />
                {/* Slide arrow */}
                <path
                  d="M 678 118 L 665 118 M 669 114 L 664 118 L 669 122"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
            </g>
          )}

          {/* Micro labels */}
          <text
            x="582"
            y="167"
            textAnchor="middle"
            className="fill-[#475569] text-[10px]"
            style={{fontFamily: 'var(--font-mono)'}}
          >
            PAD
          </text>
          <text
            x="633"
            y="170"
            textAnchor="middle"
            className="fill-[#111827] text-[10px] font-medium"
            style={{fontFamily: 'var(--font-mono)'}}
          >
            DISC
          </text>
          <text
            x="684"
            y="167"
            textAnchor="middle"
            className="fill-[#475569] text-[10px]"
            style={{fontFamily: 'var(--font-mono)'}}
          >
            PAD
          </text>
        </g>
      )}

      {/* ================= CALLOUT LABEL FOR REAR TYRE & HEADLIGHT ================= */}
      {isRearTyreActive && (
        <g>
          <polyline
            points="170,218 170,136 226,136"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="170" cy="218" r="4" fill="#EA580C" />
          <rect
            x="226"
            y="112"
            width="186"
            height="46"
            rx="8"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="1.8"
          />
          <text
            x="238"
            y="132"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Rear tyre
          </text>
          <text
            x="238"
            y="147"
            className="fill-[#64748B] text-[10.5px]"
          >
            {prefersReducedMotion
              ? 'Static highlight · Rear wheel'
              : 'Replacement tyre seated on rear rim'}
          </text>
        </g>
      )}

      {isHeadlightActive && (
        <g>
          <polyline
            points="468,119 468,72 508,72"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="468" cy="119" r="4" fill="#EA580C" />
          <rect
            x="508"
            y="48"
            width="206"
            height="46"
            rx="8"
            fill="#FFFFFF"
            stroke="#EA580C"
            strokeWidth="1.8"
          />
          <text
            x="520"
            y="68"
            className="fill-[#111827] text-[12px] font-semibold"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Headlight assembly
          </text>
          <text
            x="520"
            y="83"
            className="fill-[#64748B] text-[10.5px]"
          >
            {prefersReducedMotion
              ? 'Static highlight · Front headlamp'
              : 'New lamp fitted in front cowl'}
          </text>
        </g>
      )}
    </svg>
  );
}
