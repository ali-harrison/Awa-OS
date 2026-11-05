export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-mono font-semibold tracking-[0.18em] text-bone ${className}`}>
      AWA<span className="text-amber">/</span>OS
    </span>
  )
}
