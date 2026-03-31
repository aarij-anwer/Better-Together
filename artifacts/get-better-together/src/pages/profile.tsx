import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetDashboardSummary, useListChallenges, useLeaveChallenge, getGetDashboardSummaryQueryKey, getListChallengesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, LogOut, Trophy, Flame, Clock, AlertTriangle } from "lucide-react";
import { formatActivityName } from "@/lib/constants";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: challenges, isLoading: isChallengesLoading } = useListChallenges({ query: { queryKey: getListChallengesQueryKey() } });
  const leaveMutation = useLeaveChallenge();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);

  const handleLeave = (slugOrId: string) => {
    leaveMutation.mutate(
      { id: slugOrId },
      {
        onSuccess: () => {
          toast.success("Left challenge successfully");
          queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setConfirmLeaveId(null);
        },
        onError: () => {
          toast.error("Failed to leave challenge");
        }
      }
    );
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
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'My Profile'}
            </h1>
            <p className="text-muted-foreground font-medium">Your stats and challenges</p>
          </div>
        </div>

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

        <h2 className="text-2xl font-black tracking-tight mb-4">Your Challenges</h2>

        {(!challenges || challenges.length === 0) ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-dashed">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No challenges yet</h3>
            <p className="text-muted-foreground font-medium mb-6">Create or join a challenge to get started.</p>
            <Button onClick={() => setLocation('/challenge/new')} className="rounded-xl font-bold">Create Challenge</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map(c => (
              <Card key={c.id} className="p-5 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLocation(`/challenge/${c.slug}`)}>
                    <h3 className="font-bold text-lg truncate mb-1">{c.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {formatActivityName(c.activityType)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.durationDays}d</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${c.state === 'active' ? 'bg-green-100 text-green-700' : c.state === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.state === 'active' ? 'Active' : c.state === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 shrink-0">
                    {confirmLeaveId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="destructive" className="rounded-lg text-xs font-bold h-8" onClick={() => handleLeave(c.slug || c.id)} disabled={leaveMutation.isPending}>
                          {leaveMutation.isPending ? "..." : "Confirm"}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs font-bold h-8" onClick={() => setConfirmLeaveId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="rounded-lg text-xs font-bold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmLeaveId(c.id)}>
                        <LogOut className="w-3 h-3 mr-1" /> Leave
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t">
          <Button variant="outline" className="rounded-xl font-bold text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
