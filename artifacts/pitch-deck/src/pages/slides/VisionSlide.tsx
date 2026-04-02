const base = import.meta.env.BASE_URL;

export default function VisionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}social-proof.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt="Friends celebrating after workout"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/70 to-dark/40" />
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <span className="font-body text-[1.2vw] font-semibold text-coral tracking-wider uppercase mb-[2vh]">The Vision</span>
        <h2 className="font-display text-[4.5vw] font-800 text-white leading-[1.05] tracking-tight max-w-[50vw]">
          People don't quit on themselves. They quit when nobody's watching.
        </h2>
        <p className="font-body text-[1.8vw] text-white/50 mt-[3vh] max-w-[40vw] leading-relaxed">
          We are building the accountability layer for personal fitness. Not another tracker. Not another AI coach. Just real friends, real stakes, and the motivation that comes from not wanting to let your people down.
        </p>
        <div className="mt-[6vh] flex gap-[4vw]">
          <div className="flex flex-col">
            <span className="font-display text-[3vw] font-900 text-coral leading-none">12+</span>
            <span className="font-body text-[1.2vw] text-white/50 mt-[0.5vh]">Activity types</span>
          </div>
          <div className="w-[0.15vw] bg-white/10 self-stretch" />
          <div className="flex flex-col">
            <span className="font-display text-[3vw] font-900 text-coral leading-none">365</span>
            <span className="font-body text-[1.2vw] text-white/50 mt-[0.5vh]">Max challenge days</span>
          </div>
          <div className="w-[0.15vw] bg-white/10 self-stretch" />
          <div className="flex flex-col">
            <span className="font-display text-[3vw] font-900 text-accent leading-none">Free</span>
            <span className="font-body text-[1.2vw] text-white/50 mt-[0.5vh]">For everyone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
