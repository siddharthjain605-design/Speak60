export default function Shockwave({ color = 'var(--gold)' }: { color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="animate-shockwave absolute h-24 w-24 rounded-full border-solid"
        style={{ borderColor: color }}
      />
      <span
        className="animate-shockwave absolute h-24 w-24 rounded-full border-solid"
        style={{ borderColor: color, animationDelay: '0.15s' }}
      />
    </div>
  );
}
