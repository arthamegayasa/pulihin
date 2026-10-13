/** Wordmark PULIHIN: tanda daun-gerak sederhana + nama. */
export function Logo({ className = '', terang = false }: { className?: string; terang?: boolean }) {
  const warna = terang ? '#FFFFFF' : '#0B4F4A';
  return (
    <svg viewBox="0 0 132 28" className={className} role="img" aria-label="PULIHIN">
      <g>
        <circle cx="14" cy="14" r="13" fill={warna} />
        <path d="M8 17.5c2.2-5.6 6.4-8.6 11.6-9.1-1 5.6-4.6 9.4-10 10.2" fill="none" stroke="#C46A1B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.2" cy="18.6" r="1.9" fill={terang ? '#0B4F4A' : '#FFFFFF'} />
      </g>
      <text x="34" y="20.5" fill={warna} fontFamily="'Plus Jakarta Sans Variable', system-ui, sans-serif" fontWeight="800" fontSize="18" letterSpacing="1.2">
        PULIHIN
      </text>
    </svg>
  );
}
