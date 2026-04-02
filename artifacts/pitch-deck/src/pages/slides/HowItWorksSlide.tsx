export default function HowItWorksSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute top-0 left-0 w-full h-[0.4vh] bg-gradient-to-r from-coral via-accent to-coral/30" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-gradient-to-tl from-warm to-transparent" />
      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[8vh]">
        <span className="font-body text-[1.2vw] font-semibold text-coral tracking-wider uppercase mb-[2vh]">How It Works</span>
        <h2 className="font-display text-[4vw] font-800 text-text leading-[1.1] tracking-tight">
          Three steps to better habits
        </h2>
        <div className="flex-1 flex items-center">
          <div className="grid grid-cols-3 gap-[4vw] w-full">
            <div className="flex flex-col">
              <div className="w-[4.5vw] h-[4.5vw] rounded-[1vw] bg-coral/10 flex items-center justify-center mb-[3vh]">
                <span className="font-display text-[2.5vw] font-900 text-coral">1</span>
              </div>
              <h3 className="font-display text-[2vw] font-700 text-text mb-[1.5vh]">Create</h3>
              <p className="font-body text-[1.4vw] text-muted leading-relaxed">Pick an activity, set a daily target and duration. Pushups, running, meditation, reading -- whatever you want to get better at.</p>
            </div>
            <div className="flex flex-col">
              <div className="w-[4.5vw] h-[4.5vw] rounded-[1vw] bg-accent/10 flex items-center justify-center mb-[3vh]">
                <span className="font-display text-[2.5vw] font-900 text-accent">2</span>
              </div>
              <h3 className="font-display text-[2vw] font-700 text-text mb-[1.5vh]">Invite</h3>
              <p className="font-body text-[1.4vw] text-muted leading-relaxed">Share your unique invite code with friends. One tap to join. No sign-up friction -- just jump in and start competing.</p>
            </div>
            <div className="flex flex-col">
              <div className="w-[4.5vw] h-[4.5vw] rounded-[1vw] bg-coral/10 flex items-center justify-center mb-[3vh]">
                <span className="font-display text-[2.5vw] font-900 text-coral">3</span>
              </div>
              <h3 className="font-display text-[2vw] font-700 text-text mb-[1.5vh]">Compete</h3>
              <p className="font-body text-[1.4vw] text-muted leading-relaxed">Log your daily progress, build streaks, and climb the leaderboard. See who shows up and who falls behind.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
