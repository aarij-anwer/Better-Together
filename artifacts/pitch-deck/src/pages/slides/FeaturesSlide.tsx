export default function FeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark to-coral/5" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full border border-white/3" />
      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[8vh]">
        <span className="font-body text-[1.2vw] font-semibold text-coral tracking-wider uppercase mb-[2vh]">Key Features</span>
        <h2 className="font-display text-[4vw] font-800 text-white leading-[1.1] tracking-tight mb-[5vh]">
          Built for real accountability
        </h2>
        <div className="flex-1 grid grid-cols-2 gap-x-[5vw] gap-y-[4vh] content-center">
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-coral/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="#E8524A" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Streak Tracking</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Consecutive-day streaks with fire badges. Miss a day and everyone sees it.</p>
            </div>
          </div>
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <path d="M12 20V10M18 20V4M6 20v-4" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Live Leaderboards</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Real-time rankings sorted by total progress. Gold, silver, bronze highlights.</p>
            </div>
          </div>
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-coral/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <circle cx="12" cy="12" r="10" stroke="#E8524A" strokeWidth="2" />
                <path d="M12 8v4l3 3" stroke="#E8524A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Day-by-Day Progress</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Visual strip showing every day of your challenge. Green for done, red for missed.</p>
            </div>
          </div>
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <path d="M4 4h16v16H4z" stroke="#F97316" strokeWidth="2" />
                <path d="M9 9h6M9 12h4" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Variable Targets</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Randomized daily targets prevent plateaus and keep every day interesting.</p>
            </div>
          </div>
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-coral/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="#E8524A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Smart Backfill</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Missed a day? Log late and catch up. Reps cap intelligently so you can not game the system.</p>
            </div>
          </div>
          <div className="flex gap-[1.5vw] items-start">
            <div className="w-[3vw] h-[3vw] rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center mt-[0.3vh]">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.5vw] h-[1.5vw]">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#F97316" strokeWidth="2" />
                <circle cx="9" cy="7" r="4" stroke="#F97316" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#F97316" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-[1.6vw] font-700 text-white mb-[0.5vh]">Private Challenges</h3>
              <p className="font-body text-[1.3vw] text-white/50 leading-relaxed">Invite-only groups. Compete with people you actually know and care about.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
