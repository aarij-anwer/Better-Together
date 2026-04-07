import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useListChallenges, useJoinChallenge, useGetPublicChallenges, getGetDashboardSummaryQueryKey, getListChallengesQueryKey, getGetPublicChallengesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trophy, Activity, Clock, ArrowRight, Flame, Users, Zap, Target, CheckCircle, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatActivityName } from "@/lib/constants";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DEMO_LEADERBOARD = [
  { name: "Alex K.", initials: "AK", logged: 280, target: 300, streak: 7, color: "bg-yellow-500" },
  { name: "Jamie L.", initials: "JL", logged: 255, target: 300, streak: 5, color: "bg-gray-400" },
  { name: "Morgan R.", initials: "MR", logged: 210, target: 300, streak: 3, color: "bg-amber-600" },
  { name: "Sam T.", initials: "ST", logged: 160, target: 300, streak: 2, color: "bg-primary" },
];

const FEATURES = [
  {
    icon: Target,
    title: "Daily Targets",
    desc: "Challenging but achievable goals for every day of your challenge, with smart rest days built in.",
  },
  {
    icon: Users,
    title: "Compete with Friends",
    desc: "Live leaderboards with streaks and progress bars keep everyone accountable and motivated.",
  },
  {
    icon: Zap,
    title: "Instant Logging",
    desc: "Log your reps, km, or pages in two taps. No friction between you and the next best version of you.",
  },
];



function Welcome({ onLogin }: { onLogin: () => void }) {
  const [, setLocation] = useLocation();
  const { data: publicChallenges, isLoading: isLoadingPublic } = useGetPublicChallenges({
    query: { queryKey: getGetPublicChallengesQueryKey() },
  });

  const hasLive = !isLoadingPublic && publicChallenges && publicChallenges.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
          <div className="bg-white/75 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 text-foreground">
              Get Better <span className="text-primary">Together</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/75 max-w-xl leading-relaxed font-medium mb-8">
              Create fitness challenges, invite friends, log daily progress, and race to the top of the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Button size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold shadow-lg" onClick={() => setLocation("/challenge/demo-pushup-challenge")}>
                Try it now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold border-2" onClick={onLogin}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Live challenges */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {hasLive ? (
          <>
            <h2 className="text-3xl font-black tracking-tight text-center mb-3">Live right now</h2>
            <p className="text-center text-muted-foreground font-medium mb-10 text-lg">Real challenges, real people, real competition</p>
            <div className="space-y-6">
              {publicChallenges!.map((item) => {
                const ch = item.challenge;
                const now = new Date();
                const start = new Date(ch.startDate);
                const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
                const currentDay = Math.min(daysPassed + 1, ch.durationDays);
                const todayTarget = Array.isArray(ch.dailyTargets) && ch.dailyTargets.length >= currentDay
                  ? (ch.dailyTargets as number[])[currentDay - 1]
                  : ch.targetValue;
                const leader = item.leaderboard[0];
                return (
                  <div key={ch.id} className="grid md:grid-cols-[1fr_300px] gap-6">
                    <Card className="p-6 md:p-8 rounded-[2rem] border shadow-sm">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight mb-2">{ch.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                              <Activity className="w-4 h-4" /> {formatActivityName(ch.activityType)}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4" /> {ch.durationDays} days
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                              <Users className="w-4 h-4" /> {ch.participantCount} participants
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-100 text-green-800 shrink-0">Active</span>
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                          Day {currentDay} of {ch.durationDays}
                          {todayTarget > 0 ? ` — Today's target: ${todayTarget} ${ch.unit}` : " — Rest day"}
                        </p>
                        {leader && (
                          <p className="text-base text-muted-foreground font-semibold mb-4">
                            🏆 Leader: <span className="text-foreground font-black">{leader.userName}</span> with {leader.totalLogged} {ch.unit}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2">
                          <Button
                            variant="outline"
                            className="rounded-xl font-bold border-2"
                            onClick={() => setLocation(`/challenge/${ch.slug || ch.id}`)}
                          >
                            View Challenge <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                          <Button
                            className="rounded-xl font-bold shadow-sm"
                            onClick={onLogin}
                          >
                            Join & Compete
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 rounded-[2rem] border shadow-sm bg-card/50">
                      <h3 className="font-black text-lg flex items-center gap-2 mb-5">
                        <Trophy className="w-5 h-5 text-primary" /> Leaderboard
                      </h3>
                      <div className="space-y-5">
                        {item.leaderboard.map((entry) => (
                          <div key={entry.userId} className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 shadow-sm shrink-0">
                              {entry.profileImageUrl
                                ? <img src={entry.profileImageUrl} className="w-full h-full rounded-full object-cover" alt={entry.userName} />
                                : <AvatarFallback className="bg-secondary font-bold text-sm">{entry.userName?.charAt(0) ?? "?"}</AvatarFallback>
                              }
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base truncate leading-none mb-1">{entry.userName}</div>
                              <div className="text-sm font-semibold text-muted-foreground leading-none">{entry.totalLogged} {ch.unit}</div>
                            </div>
                            {entry.streak > 0 && (
                              <div className="text-sm font-black text-orange-500 flex items-center bg-orange-100 px-2 py-0.5 rounded-md shrink-0">
                                <Flame className="w-3 h-3 mr-1" /> {entry.streak}
                              </div>
                            )}
                          </div>
                        ))}
                        {item.leaderboard.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No activity yet — be the first!</p>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-black tracking-tight text-center mb-3">See it in action</h2>
            <p className="text-center text-muted-foreground font-medium mb-10 text-lg">Here's what a fitness challenge looks like</p>
            <div className="grid md:grid-cols-[1fr_320px] gap-6">
              <Card className="p-6 md:p-8 rounded-[2rem] border shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-2">10-Day Pushup Challenge</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg"><Activity className="w-4 h-4" /> Pushups</span>
                      <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4" /> 10 days</span>
                      <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg"><Users className="w-4 h-4" /> 4 participants</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-100 text-green-800 shrink-0">Active</span>
                </div>
                <div className="flex flex-col items-center py-6">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Day 7 of 10 — Today's target: 30 reps</p>
                  <Progress value={73} className="h-4 w-full max-w-xs rounded-full mb-6" />
                  <Button className="rounded-xl font-bold shadow-sm" onClick={onLogin}>Join & Compete</Button>
                </div>
              </Card>
              <Card className="p-6 rounded-[2rem] border shadow-sm bg-card/50">
                <h3 className="font-black text-xl flex items-center gap-2 mb-6"><Trophy className="w-6 h-6 text-primary" /> Leaderboard</h3>
                <div className="space-y-5">
                  {DEMO_LEADERBOARD.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 shadow-sm shrink-0"><AvatarFallback className="bg-secondary font-bold text-sm">{p.initials}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate leading-none mb-1">{p.name}</div>
                        <div className="text-sm font-semibold text-muted-foreground leading-none">{p.logged} reps</div>
                      </div>
                      {p.streak > 0 && <div className="text-sm font-black text-orange-500 flex items-center bg-orange-100 px-2 py-0.5 rounded-md shrink-0"><Flame className="w-3 h-3 mr-1" /> {p.streak}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Feature row */}
      <div className="bg-secondary/30 border-y">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="flex flex-col items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-black text-xl mb-2">{f.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-muted-foreground">Free to use · No credit card needed</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-4">Ready to start your challenge?</h2>
        <p className="text-xl text-muted-foreground font-medium mb-8">Join thousands of people pushing themselves further, together.</p>
        <Button size="lg" className="h-16 px-12 rounded-2xl text-xl font-bold shadow-lg" onClick={onLogin}>
          Get started for free
        </Button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: challenges, isLoading: isChallengesLoading } = useListChallenges({ query: { queryKey: getListChallengesQueryKey() } });
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [inviteInput, setInviteInput] = useState("");
  const joinMutation = useJoinChallenge();
  const queryClient = useQueryClient();

  const forceHome = new URLSearchParams(searchString).has("home");

  useEffect(() => {
    if (!forceHome && challenges && challenges.length === 1) {
      setLocation(`/challenge/${challenges[0].slug}`);
    }
  }, [challenges, setLocation, forceHome]);

  const handleJoinByCode = () => {
    const code = inviteInput.trim();
    if (!code) return;
    const inviteCode = code.includes("/join/") ? code.split("/join/")[1] : code;
    joinMutation.mutate({ inviteCode }, {
      onSuccess: (res) => {
        toast.success("Joined challenge successfully!");
        queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setInviteInput("");
        setLocation(`/challenge/${res.slug}`);
      },
      onError: () => {
        toast.error("Could not join. Check the code and try again.");
      }
    });
  };

  if (isChallengesLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">Your Challenges</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setLocation('/challenge/new')} variant="outline" className="rounded-full h-10 px-4 font-bold border-2">
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter invite code or link..."
              className="h-12 rounded-xl pl-10 border-2 font-medium"
              value={inviteInput}
              onChange={e => setInviteInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleJoinByCode(); }}
            />
          </div>
          <Button
            onClick={handleJoinByCode}
            disabled={!inviteInput.trim() || joinMutation.isPending}
            className="h-12 rounded-xl px-6 font-bold"
          >
            {joinMutation.isPending ? "Joining..." : "Join"}
          </Button>
        </div>

        {challenges?.length === 0 ? (
          <div className="text-center py-20 px-4 bg-card rounded-[2rem] border border-dashed shadow-sm">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-3">No active challenges</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-lg font-medium">Create a challenge and invite your friends to start getting better together.</p>
            <Button onClick={() => setLocation('/challenge/new')} size="lg" className="rounded-2xl h-14 px-8 text-lg font-bold shadow-md">
              Create your first challenge
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {challenges?.map(c => (
              <Card key={c.id} className="p-5 md:p-6 rounded-[1.5rem] hover:shadow-md hover:border-primary/50 transition-all cursor-pointer border group" onClick={() => setLocation(`/challenge/${c.slug}`)}>
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="font-black text-2xl tracking-tight mb-2 group-hover:text-primary transition-colors">{c.title}</h3>
                     <div className="flex items-center gap-3 text-sm text-muted-foreground font-semibold">
                       <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {formatActivityName(c.activityType)}</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {c.durationDays} days</span>
                     </div>
                   </div>
                   <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${c.state === 'active' ? 'bg-green-100 text-green-800' : c.state === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                     {c.state === 'active' ? 'Active' : c.state === 'completed' ? 'Completed' : 'Upcoming'}
                   </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2">
                  <span>Day {c.currentDay} of {c.durationDays}</span>
                  <span className="font-bold text-foreground">{c.todayLogged}/{c.todayTarget} {c.unit}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={c.todayTarget > 0 ? Math.min(100, (c.todayLogged / c.todayTarget) * 100) : 0} className="h-3 flex-1 rounded-full" />
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function Home() {
  const { user, login } = useAuth();

  if (!user) return <Welcome onLogin={login} />;
  return <Dashboard />;
}
