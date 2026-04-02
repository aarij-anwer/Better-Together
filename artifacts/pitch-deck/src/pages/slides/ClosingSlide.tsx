export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      <div className="absolute inset-0 bg-gradient-to-br from-coral/15 via-dark to-accent/10" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full bg-coral/5 -translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-[10vh] right-[10vw] w-[20vw] h-[20vw] rounded-full border border-white/5" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <div className="w-[5vw] h-[5vw] rounded-full bg-coral flex items-center justify-center mb-[4vh]">
          <svg viewBox="0 0 24 24" fill="none" className="w-[2.8vw] h-[2.8vw]">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="white" />
          </svg>
        </div>
        <h2 className="font-display text-[6vw] font-900 text-white leading-[0.95] tracking-tighter">
          Get Better Together
        </h2>
        <p className="font-body text-[2vw] text-white/40 mt-[2vh] max-w-[40vw] leading-relaxed">
          The social fitness challenge app that turns consistency into a team sport
        </p>
        <div className="mt-[6vh] flex items-center gap-[3vw]">
          <div className="w-[8vw] h-[0.2vh] bg-coral/40 rounded-full" />
          <span className="font-body text-[1.4vw] text-white/30 tracking-wider">get-better-together.replit.app</span>
          <div className="w-[8vw] h-[0.2vh] bg-coral/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
