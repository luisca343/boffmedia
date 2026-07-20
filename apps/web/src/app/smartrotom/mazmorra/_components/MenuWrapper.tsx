export default function MenuWrapper({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full bg-cover bg-center noSelect ${className}`}
      style={{
        // A gradient rather than an image: there is no dungeon art in /smartrotom/img yet,
        // and a missing background reads as a broken page.
        backgroundImage:
          'radial-gradient(circle at 50% 0%, #2a1b3d 0%, #14101c 55%, #060509 100%)',
        fontFamily: 'Minecrafter',
      }}
    >
      {children}
    </div>
  );
}
