const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        alt="Friends exercising together"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
      <div className="relative z-10 flex flex-col justify-end h-full px-[8vw] pb-[10vh]">
        <div className="flex items-center gap-[1.5vw] mb-[3vh]">
          <div className="w-[3vw] h-[3vw] rounded-full bg-coral flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-[1.8vw] h-[1.8vw]">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="white" />
            </svg>
          </div>
          <span className="font-body text-[1.4vw] font-medium text-white/70 tracking-wider uppercase">Social Fitness Challenges</span>
        </div>
        <h1 className="font-display text-[7vw] font-900 text-white leading-[0.95] tracking-tighter max-w-[70vw]">
          Get Better Together
        </h1>
        <p className="font-body text-[2vw] text-white/60 mt-[2vh] max-w-[45vw] leading-relaxed">
          Turn consistency into a team sport
        </p>
      </div>
      <div className="absolute bottom-[4vh] right-[8vw] z-10">
        <div className="w-[6vw] h-[0.3vh] bg-coral rounded-full" />
      </div>
    </div>
  );
}
