import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetDashboardSummary, useListChallenges, useJoinChallenge, getGetDashboardSummaryQueryKey, getListChallengesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trophy, Activity, Clock, ArrowRight, Link2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatActivityName } from "@/lib/constants";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function Welcome({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
        </div>
        <div className="relative z-10 max-w-lg w-full bg-white/90 backdrop-blur-2xl p-10 rounded-[2rem] border border-white/40 shadow-2xl text-center">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Activity className="w-8 h-8 text-primary-foreground" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">Get Better Together</h1>
           <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
             Hold your friends accountable. Track your habits. Focused, rewarding, and a little competitive.
           </p>
           <Button size="lg" className="w-full text-xl h-16 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all" onClick={onLogin}>
             Log in to Start
           </Button>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: challenges, isLoading: isChallengesLoading } = useListChallenges({ query: { queryKey: getListChallengesQueryKey() } });
  const [, setLocation] = useLocation();
  const [inviteInput, setInviteInput] = useState("");
  const joinMutation = useJoinChallenge();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (challenges) {
      const active = challenges.filter(c => c.state === 'active');
      if (active.length === 1) {
        setLocation(`/challenge/${active[0].id}`);
      }
    }
  }, [challenges, setLocation]);

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
        setLocation(`/challenge/${res.challengeId}`);
      },
      onError: () => {
        toast.error("Could not join. Check the code and try again.");
      }
    });
  };

  if (isSummaryLoading || isChallengesLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Today</div>
            <div className="text-3xl font-black tracking-tight">{summary?.totalCompletedToday || 0}</div>
            <div className="text-sm text-muted-foreground font-semibold">logged</div>
          </div>
          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Done Today</div>
            <div className="text-3xl font-black tracking-tight">{summary?.completedChallengesToday || 0}</div>
            <div className="text-sm text-muted-foreground font-semibold">completed</div>
          </div>
          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Active</div>
            <div className="text-3xl font-black tracking-tight">{summary?.activeChallenges || 0}</div>
            <div className="text-sm text-muted-foreground font-semibold">challenges</div>
          </div>
          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total</div>
            <div className="text-3xl font-black tracking-tight">{summary?.totalChallenges || 0}</div>
            <div className="text-sm text-muted-foreground font-semibold">challenges</div>
          </div>
        </div>

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
              <Card key={c.id} className="p-5 md:p-6 rounded-[1.5rem] hover:shadow-md hover:border-primary/50 transition-all cursor-pointer border group" onClick={() => setLocation(`/challenge/${c.id}`)}>
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="font-black text-2xl tracking-tight mb-2 group-hover:text-primary transition-colors">{c.title}</h3>
                     <div className="flex items-center gap-3 text-sm text-muted-foreground font-semibold">
                       <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg text-secondary-foreground"><Activity className="w-4 h-4" /> {formatActivityName(c.activityType)}</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {c.durationDays}d</span>
                       {c.state !== 'active' && <span className="px-2 py-0.5 bg-secondary rounded-lg text-xs font-bold capitalize">{c.state === 'not_started' ? 'Upcoming' : 'Completed'}</span>}
                     </div>
                   </div>
                   <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                     <ArrowRight className="w-5 h-5" />
                   </div>
                </div>
                
                <div>
                   <div className="flex justify-between text-sm mb-2 font-bold text-muted-foreground">
                     <span className="uppercase tracking-wider">{c.type === 'daily' ? 'Today' : 'Total'}</span>
                     <span>{c.type === 'daily' ? c.todayLogged : c.totalLogged} / {c.type === 'daily' ? c.todayTarget : c.targetValue} {c.unit}</span>
                   </div>
                   <Progress value={Math.min(100, c.type === 'daily' ? (c.todayTarget > 0 ? (c.todayLogged / c.todayTarget) * 100 : 0) : (c.targetValue > 0 ? (c.totalLogged / c.targetValue) * 100 : 0))} className="h-3 rounded-full bg-secondary [&>div]:bg-primary" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function Home() {
  const { isAuthenticated, login, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!isAuthenticated) return <Welcome onLogin={login} />;
  return <Dashboard />;
}
