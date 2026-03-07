export default function Logo({ className = '' }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {/*
        Using standard img tag here instead of next/image to ensure the locally
        added logo dynamically loads without requiring a dev server restart.
      */}
      <img
        src="/logo.png"
        alt="LanceLedger Logo"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
