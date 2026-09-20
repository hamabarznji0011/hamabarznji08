export function GoldBar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gb-face" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="35%" stopColor="#f5c542" />
          <stop offset="70%" stopColor="#d99a1a" />
          <stop offset="100%" stopColor="#a86c08" />
        </linearGradient>
        <linearGradient id="gb-top" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff6cc" />
          <stop offset="55%" stopColor="#ffd85e" />
          <stop offset="100%" stopColor="#c98b12" />
        </linearGradient>
        <linearGradient id="gb-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c88f14" />
          <stop offset="100%" stopColor="#8a5906" />
        </linearGradient>
      </defs>

      {/* top bevel */}
      <path d="M14 8h36l6 8H8l6-8Z" fill="url(#gb-top)" />
      {/* right side */}
      <path d="M56 16l-4 16h-6l4-16h6Z" fill="url(#gb-side)" />
      {/* front face */}
      <path d="M8 16h42l-4 16H4l4-16Z" fill="url(#gb-face)" />
      {/* highlight */}
      <path d="M9 18h39l-1 3H8l1-3Z" fill="#fff8d2" opacity="0.55" />
      <text
        x="26"
        y="28"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#151515"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.5"
      >
        XAU
      </text>
    </svg>
  );
}