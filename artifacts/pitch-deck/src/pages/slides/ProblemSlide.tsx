export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute top-0 right-0 w-[45vw] h-full bg-gradient-to-l from-coral/8 to-transparent" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vh] bg-gradient-to-tr from-accent/5 to-transparent rounded-tr-full" />
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <span className="font-body text-[1.2vw] font-semibold text-coral tracking-wider uppercase mb-[2vh]">The Problem</span>
        <h2 className="font-display text-[5vw] font-800 text-text leading-[1.05] tracking-tight max-w-[55vw]">
          The biggest struggle in getting better is consistency.
        </h2>
        <div className="mt-[6vh] flex gap-[4vw]">
          <div className="flex flex-col">
            <span className="font-display text-[5vw] font-900 text-coral leading-none">80%</span>
            <span className="font-body text-[1.3vw] text-muted mt-[1vh] max-w-[14vw] leading-snug">of people quit new fitness routines within 6 weeks</span>
          </div>
          <div className="w-[0.15vw] bg-text/10 self-stretch" />
          <div className="flex flex-col">
            <span className="font-display text-[5vw] font-900 text-coral leading-none">67%</span>
            <span className="font-body text-[1.3vw] text-muted mt-[1vh] max-w-[14vw] leading-snug">of gym memberships go unused after the first month</span>
          </div>
          <div className="w-[0.15vw] bg-text/10 self-stretch" />
          <div className="flex flex-col">
            <span className="font-display text-[5vw] font-900 text-coral leading-none">1 in 4</span>
            <span className="font-body text-[1.3vw] text-muted mt-[1vh] max-w-[14vw] leading-snug">people stick with a habit longer with social accountability</span>
          </div>
        </div>
      </div>
    </div>
  );
}
