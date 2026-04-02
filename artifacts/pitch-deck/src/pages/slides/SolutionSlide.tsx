export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-dark to-accent/10" />
      <div className="absolute top-[15vh] right-[8vw] w-[25vw] h-[25vw] rounded-full border border-white/5" />
      <div className="absolute top-[20vh] right-[12vw] w-[17vw] h-[17vw] rounded-full border border-white/5" />
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <span className="font-body text-[1.2vw] font-semibold text-coral tracking-wider uppercase mb-[2vh]">The Solution</span>
        <h2 className="font-display text-[4.5vw] font-800 text-white leading-[1.1] tracking-tight max-w-[50vw]">
          Friendly competition makes consistency feel effortless.
        </h2>
        <p className="font-body text-[1.8vw] text-white/50 mt-[3vh] max-w-[42vw] leading-relaxed">
          Get Better Together lets you create private fitness challenges with friends. When your streak is on the line and your friends can see your progress, showing up becomes the easy part.
        </p>
        <div className="mt-[6vh] flex items-center gap-[2vw]">
          <div className="px-[2vw] py-[1.5vh] bg-coral/20 border border-coral/30 rounded-[0.6vw]">
            <span className="font-display text-[1.4vw] font-700 text-coral">Create a Challenge</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div className="w-[3vw] h-[0.15vh] bg-white/30" />
            <svg viewBox="0 0 24 24" fill="none" className="w-[1.2vw] h-[1.2vw]">
              <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="px-[2vw] py-[1.5vh] bg-white/5 border border-white/10 rounded-[0.6vw]">
            <span className="font-display text-[1.4vw] font-700 text-white/70">Invite Friends</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div className="w-[3vw] h-[0.15vh] bg-white/30" />
            <svg viewBox="0 0 24 24" fill="none" className="w-[1.2vw] h-[1.2vw]">
              <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="px-[2vw] py-[1.5vh] bg-white/5 border border-white/10 rounded-[0.6vw]">
            <span className="font-display text-[1.4vw] font-700 text-white/70">Compete Together</span>
          </div>
        </div>
      </div>
    </div>
  );
}
