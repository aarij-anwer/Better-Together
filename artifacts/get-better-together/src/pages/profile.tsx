import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetDashboardSummary, useListChallenges, useLeaveChallenge, useUpdateProfile, getGetDashboardSummaryQueryKey, getListChallengesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity, LogOut, Trophy, Clock, Pencil, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatActivityName } from "@/lib/constants";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: challenges, isLoading: isChallengesLoading } = useListChallenges({ query: { queryKey: getListChallengesQueryKey() } });
  const leaveMutation = useLeaveChallenge();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const startEditing = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEditingName(true);
  };

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

  const handleSaveName = () => {
    updateProfileMutation.mutate(
      { data: { firstName: firstName.trim(), lastName: lastName.trim() } },
      {
        onSuccess: () => {
          toast.success("Name updated");
          setEditingName(false);
          queryClient.invalidateQueries({ queryKey: ["getCurrentAuthUser"] });
          window.location.reload();
        },
        onError: () => {
          toast.error("Failed to update name");
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEditingName(false);
  };

  if (isSummaryLoading || isChallengesLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';
  const initials = user?.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}` : 'U';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-8">
        <Card className="p-6 md:p-8 rounded-[2rem] border shadow-sm mb-8">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              {user?.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="h-10 rounded-lg border-2 font-medium"
                    />
                    <Input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="h-10 rounded-lg border-2 font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-lg h-8 font-bold" onClick={handleSaveName} disabled={updateProfileMutation.isPending}>
                      <Check className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg h-8 font-bold" onClick={handleCancelEdit}>
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight truncate">{displayName}</h1>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={startEditing}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              {user?.email && <p className="text-muted-foreground font-medium text-sm mt-1 truncate">{user.email}</p>}
            </div>
          </div>
        </Card>

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
