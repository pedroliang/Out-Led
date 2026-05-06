// OUT LED — SVG icons (custom illustrations for products + UI)

const Icon = ({ name, color }) => {
  const props = { viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: "product-svg" };
  const c = color || "#5cf0ff";

  switch (name) {
    case "projector":
      return (
        <svg {...props}>
          <defs>
            <radialGradient id="pr-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="0.9"/>
              <stop offset="60%" stopColor={c} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={c} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect x="20" y="32" width="60" height="36" rx="3" stroke="#7a8cae" strokeWidth="1.5" fill="#1a2c4d"/>
          <rect x="24" y="36" width="52" height="28" rx="1.5" fill="url(#pr-glow)"/>
          <g stroke="#3d5478" strokeWidth="0.6" opacity="0.5">
            {[...Array(7)].map((_, i) => <line key={i} x1={24 + i*7.5} y1="36" x2={24 + i*7.5} y2="64"/>)}
            {[...Array(4)].map((_, i) => <line key={i} x1="24" y1={36 + i*7} x2="76" y2={36 + i*7}/>)}
          </g>
          <rect x="42" y="68" width="16" height="6" fill="#7a8cae"/>
          <rect x="36" y="74" width="28" height="3" rx="1" fill="#5a6e92"/>
          <circle cx="78" cy="42" r="1.5" fill={c}/>
        </svg>
      );

    case "projector-color":
      return (
        <svg {...props}>
          <defs>
            <radialGradient id="prc-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="1"/>
              <stop offset="50%" stopColor={c} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={c} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect x="20" y="32" width="60" height="36" rx="3" stroke="#7a8cae" strokeWidth="1.5" fill="#1a2c4d"/>
          <rect x="24" y="36" width="52" height="28" rx="1.5" fill="url(#prc-glow)"/>
          <rect x="42" y="68" width="16" height="6" fill="#7a8cae"/>
          <rect x="36" y="74" width="28" height="3" rx="1" fill="#5a6e92"/>
        </svg>
      );

    case "fan":
      return (
        <svg {...props}>
          <circle cx="50" cy="22" r="6" fill="#5a6e92"/>
          <rect x="48" y="18" width="4" height="14" fill="#7a8cae"/>
          <g transform="translate(50 50)">
            <ellipse cx="0" cy="-14" rx="6" ry="22" fill="#3d5478" opacity="0.85" transform="rotate(0)"/>
            <ellipse cx="0" cy="-14" rx="6" ry="22" fill="#455d8a" opacity="0.85" transform="rotate(120)"/>
            <ellipse cx="0" cy="-14" rx="6" ry="22" fill="#3d5478" opacity="0.85" transform="rotate(240)"/>
            <circle r="8" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1"/>
            <circle r="4" fill={c} opacity="0.9"/>
            <circle r="2" fill="#fff"/>
          </g>
        </svg>
      );

    case "strip":
      return (
        <svg {...props}>
          <rect x="10" y="44" width="80" height="12" rx="1" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1"/>
          {[...Array(10)].map((_, i) => (
            <g key={i}>
              <rect x={14 + i*7.4} y="48" width="4" height="4" rx="0.5" fill={c}/>
              <circle cx={16 + i*7.4} cy="50" r="6" fill={c} opacity="0.18"/>
            </g>
          ))}
        </svg>
      );

    case "neon":
      return (
        <svg {...props}>
          <path d="M 15 60 Q 30 30, 50 50 T 85 40" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.3"/>
          <path d="M 15 60 Q 30 30, 50 50 T 85 40" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 15 60 Q 30 30, 50 50 T 85 40" stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8"/>
        </svg>
      );

    case "bulb":
      return (
        <svg {...props}>
          <defs>
            <radialGradient id="bulb-glow" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
              <stop offset="35%" stopColor={c} stopOpacity="0.9"/>
              <stop offset="100%" stopColor={c} stopOpacity="0.3"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="42" r="22" fill="url(#bulb-glow)"/>
          <circle cx="50" cy="42" r="22" fill="none" stroke="#7a8cae" strokeWidth="1" opacity="0.5"/>
          <rect x="40" y="62" width="20" height="6" fill="#7a8cae"/>
          <path d="M 40 68 L 42 72 L 58 72 L 60 68 Z" fill="#5a6e92"/>
          <path d="M 42 72 L 44 76 L 56 76 L 58 72" fill="#7a8cae"/>
          <rect x="46" y="76" width="8" height="3" fill="#3d5478"/>
        </svg>
      );

    case "linear":
      return (
        <svg {...props}>
          <rect x="10" y="44" width="80" height="12" rx="2" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1"/>
          <rect x="13" y="47" width="74" height="6" rx="1" fill={c} opacity="0.85"/>
          <rect x="13" y="47" width="74" height="2" rx="1" fill="#fff" opacity="0.6"/>
        </svg>
      );

    case "plafon":
      return (
        <svg {...props}>
          <rect x="20" y="20" width="60" height="60" rx="4" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1.5"/>
          <rect x="26" y="26" width="48" height="48" rx="2" fill={c} opacity="0.85"/>
          <rect x="26" y="26" width="48" height="48" rx="2" fill="url(#plf-grad)" opacity="0.4"/>
          <defs>
            <radialGradient id="plf-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff"/>
              <stop offset="100%" stopColor={c} stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>
      );

    case "spike":
      return (
        <svg {...props}>
          <circle cx="50" cy="32" r="14" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1.5"/>
          <circle cx="50" cy="32" r="9" fill={c} opacity="0.85"/>
          <circle cx="50" cy="32" r="9" fill="url(#sp-glow)"/>
          <defs>
            <radialGradient id="sp-glow"><stop stopColor="#fff"/><stop offset="1" stopColor={c} stopOpacity="0"/></radialGradient>
          </defs>
          <rect x="48" y="46" width="4" height="6" fill="#5a6e92"/>
          <path d="M 46 52 L 54 52 L 52 88 L 48 88 Z" fill="#7a8cae"/>
        </svg>
      );

    case "marker":
      return (
        <svg {...props}>
          <rect x="30" y="30" width="40" height="40" rx="3" fill="#1a2c4d" stroke="#7a8cae" strokeWidth="1.5"/>
          <rect x="35" y="46" width="30" height="8" rx="1" fill={c}/>
          <rect x="35" y="46" width="30" height="3" fill="#fff" opacity="0.5"/>
        </svg>
      );

    default:
      return <svg {...props}><circle cx="50" cy="50" r="30" fill={c} opacity="0.5"/></svg>;
  }
};

// Small UI icons
const UI = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  cart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h2l2.5 12h11l2.5-9H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18 18 6"/></svg>,
  arrowRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  truck: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="13" height="11" rx="1"/><path d="M15 9h5l2 4v4h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>,
  shield: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2 4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>,
  sparkle: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  card: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>,
  lightning: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m13 2-9 13h7l-1 7 9-13h-7z"/></svg>,
  tag: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12V3h9l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>,
};

window.OUTLED_Icon = Icon;
window.OUTLED_UI = UI;
