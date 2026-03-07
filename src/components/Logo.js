import Image from 'next/image';

export default function Logo({ className = '' }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      <Image
        src="/logo.png"
        alt="LanceLedger Logo"
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        priority
      />
    </div>
  );
}
