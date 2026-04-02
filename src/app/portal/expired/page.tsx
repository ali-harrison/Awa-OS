export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-[#F5F0E8] font-mono text-2xl font-semibold tracking-widest uppercase mb-4">
          AWA/OS
        </h1>
        <div className="border border-[#1A1A1A] px-6 py-8">
          <p className="text-[#C9963A] font-mono text-sm mb-3">Link expired</p>
          <p className="text-[#8A8580] font-mono text-sm leading-relaxed">
            This portal link has expired or is invalid. Please contact your project manager for a new link.
          </p>
          <div className="mt-6 pt-6 border-t border-[#1A1A1A]">
            <a
              href="mailto:ali@tewairama.digital"
              className="text-[#F5F0E8] font-mono text-xs hover:text-[#C9963A] transition-colors duration-150"
            >
              ali@tewairama.digital →
            </a>
          </div>
        </div>
      </div>
      <p className="fixed bottom-4 right-4 text-[#2A2A2A] font-mono text-[10px] tracking-widest">v0.1.0</p>
    </div>
  )
}
