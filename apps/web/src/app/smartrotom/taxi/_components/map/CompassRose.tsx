export const CompassRose = () => {
  return (
    <div className="absolute top-4 left-4 z-40">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="29" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
        <line x1="30" y1="5" x2="30" y2="55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <line x1="5" y1="30" x2="55" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <text x="30" y="10" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">N</text>
        <text x="50" y="30" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">E</text>
        <text x="30" y="52" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">S</text>
        <text x="10" y="30" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">W</text>
      </svg>
    </div>
  );
};
