import { useLocation, useRoute } from "wouter";
import { useGetChallenge, useLogProgress, getGetChallengeQueryKey, getGetProgressQueryKey, getListChallengesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Trophy, Clock, Users, ArrowRight, Share, CheckCircle2, Flame, CalendarDays } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatActivityName } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChallengeDetail() {
  const [, params] = useRoute('/challenge/:id');
  const id = params?.id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logMutation = useLogProgress();
  const [customVal, setCustomVal] = useState("");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  
  const { data, isLoading } = useGetChallenge(id as string, { query: { enabled: !!id, queryKey: getGetChallengeQueryKey(id as string) } });
  
  if (isLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );
  
  if (!data) return (
    <Layout>
      <div className="p-8 text-center text-xl font-bold">Challenge not found</div>
    </Layout>
  );

  const { challenge, userProgress, leaderboard, streak } = data;

  const handleLog = (value: number) => {
    if (challenge.state === 'not_started') return;
    const previousTotal = userProgress.totalLogged;
    const target = userProgress.totalTarget;
    const alreadyCompleted = target > 0 && previousTotal >= target;
    const willComplete = target > 0 && !alreadyCompleted && previousTotal + value >= target;

    logMutation.mutate(
      { id: challenge.slug || challenge.id, data: { value } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChallengeQueryKey(challenge.slug || challenge.id) });
          queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey(challenge.slug || challenge.id) });
          queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          if (alreadyCompleted) {
            toast.info("You've already completed this challenge! Extra reps won't count toward the total.");
          } else if (willComplete) {
            toast.success("Challenge target reached! Amazing work! 🎉");
          } else {
            toast.success(`Logged ${value} ${challenge.unit}`);
          }
          setCustomVal("");
        },
        onError: (error: unknown) => {
          const err = error as { data?: { error?: string } | null; message?: string } | undefined;
          const serverMsg = (err?.data && typeof err.data === 'object' && 'error' in err.data) ? err.data.error : '';
          const errorMsg = serverMsg || err?.message || "";
          if (errorMsg.includes("fully completed")) {
            toast.info("You've already completed this challenge! Extra reps won't count toward the total.");
          } else if (errorMsg.includes("rest day")) {
            toast.info("Today is a rest day — no logging needed!");
          } else {
            toast.error(errorMsg || "Failed to log activity");
          }
          setCustomVal("");
        }
      }
    );
  };

  const copyInvite = () => {
    const url = `${window.location.origin}/join/${challenge.inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard");
  };

  const isCompleted = challenge.state === 'completed';
  const isNotStarted = challenge.state === 'not_started';
  const hasLogs = userProgress.totalLogged > 0;

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  const todayDayIdx = userProgress.days?.findIndex(d => d.date === todayStr) ?? -1;
  const viewIdx = selectedDayIdx ?? todayDayIdx;
  const viewDay = userProgress.days && viewIdx >= 0 ? userProgress.days[viewIdx] : null;
  const isViewingRestDay = viewDay != null && viewDay.target === 0;
  const isTodayRestDay = userProgress.todayTarget === 0;
  const displayTarget = viewDay?.target ?? (challenge.dailyTargets ? challenge.dailyTargets[0] : userProgress.todayTarget);

  const formatDayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full px-6 md:px-8 py-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight">{challenge.title}</h1>
              {isCompleted && <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-bold">
              <span className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg"><Activity className="w-4 h-4" /> {formatActivityName(challenge.activityType)}</span>
              <span className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4" /> {challenge.durationDays} days</span>
              <span className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg"><Users className="w-4 h-4" /> {challenge.participantCount || 0} participants</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-black flex items-center gap-2 text-sm shadow-sm border border-orange-200">
                <Flame className="w-5 h-5" /> {streak} Day Streak
              </div>
            )}
            <Button onClick={copyInvite} variant="outline" className="rounded-xl h-11 border-2 font-bold bg-card text-primary border-primary/20 hover:bg-primary/5">
              <Share className="w-4 h-4 mr-2" /> Invite
            </Button>
          </div>
        </div>

        {isNotStarted && (
           <div className="bg-secondary/50 border-2 border-secondary text-secondary-foreground p-6 rounded-2xl mb-8 text-center shadow-sm">
             <h3 className="font-black text-xl mb-1">Challenge hasn't started yet</h3>
             <p className="text-muted-foreground font-medium text-lg">Starts on {new Date(challenge.startDate).toLocaleDateString()}</p>
           </div>
        )}

        <div className="grid md:grid-cols-[1fr_340px] gap-6 min-w-0">
           <div className="space-y-6 min-w-0">
              <Card className="p-6 md:p-10 rounded-[2rem] border shadow-sm flex flex-col items-center overflow-hidden">
                {challenge.type === 'daily' ? (
                  <>
                    <h3 className="font-bold text-lg text-muted-foreground uppercase tracking-widest mb-8">
                      {viewDay && viewDay.date !== todayStr
                        ? new Date(viewDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : "Today's Progress"}
                    </h3>
                    <ProgressRing
                      progress={viewDay ? (isViewingRestDay ? 100 : Math.min(100, (viewDay.logged / viewDay.target) * 100)) : 0}
                      size={220}
                      strokeWidth={18}
                    />
                    <div className="mt-8 mb-10 text-center">
                      {isViewingRestDay ? (
                        <>
                          <div className="text-4xl font-black tracking-tight text-green-600">Rest Day</div>
                          <div className="text-lg text-muted-foreground font-bold mt-2">Take a break and recover!</div>
                        </>
                      ) : (
                        <>
                          <div className="text-6xl font-black tracking-tight">
                            {viewDay?.logged ?? 0}
                            <span className="text-3xl text-muted-foreground font-semibold"> / {displayTarget}</span>
                          </div>
                          <div className="text-xl text-muted-foreground font-bold mt-2 uppercase tracking-wider">{challenge.unit}</div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-6">
                    <h3 className="font-bold text-lg text-muted-foreground uppercase tracking-widest mb-8">Total Progress</h3>
                    <div className="mb-6">
                      <div className="text-6xl font-black tracking-tight mb-6">{userProgress.totalLogged} <span className="text-3xl text-muted-foreground font-semibold">/ {userProgress.totalTarget}</span></div>
                      <Progress value={Math.min(100, userProgress.totalTarget > 0 ? (userProgress.totalLogged / userProgress.totalTarget) * 100 : 0)} className="h-6 rounded-full" />
                    </div>
                    <div className="text-xl text-muted-foreground font-bold uppercase tracking-wider">{challenge.unit}</div>
                  </div>
                )}

                {!isNotStarted && !hasLogs && (
                  <div className="w-full bg-primary/5 border-2 border-primary/10 rounded-2xl p-6 text-center mb-6">
                    <h4 className="font-black text-lg mb-2 text-primary">Ready to start?</h4>
                    <p className="text-muted-foreground font-medium">Log your first activity below to get going!</p>
                  </div>
                )}

                {!isNotStarted && !isTodayRestDay && (
                  <div className="w-full border-t pt-8">
                    <h4 className="font-black text-xl mb-6 text-center">Log Activity</h4>
                    <div className="flex gap-3 justify-center mb-6 max-w-[340px] mx-auto">
                      <Button onClick={() => handleLog(10)} disabled={isNotStarted || logMutation.isPending} variant="outline" className="flex-1 rounded-2xl h-16 text-xl font-black border-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">+10</Button>
                      <Button onClick={() => handleLog(20)} disabled={isNotStarted || logMutation.isPending} variant="outline" className="flex-1 rounded-2xl h-16 text-xl font-black border-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">+20</Button>
                    </div>
                    <div className="flex gap-3 max-w-[340px] mx-auto">
                      <Input 
                        type="number" 
                        placeholder="Custom..." 
                        className="h-14 rounded-xl text-center font-bold text-lg border-2" 
                        value={customVal}
                        onChange={e => setCustomVal(e.target.value)}
                        disabled={isNotStarted}
                      />
                      <Button 
                        onClick={() => handleLog(Number(customVal))} 
                        disabled={isNotStarted || !customVal || Number(customVal) <= 0 || logMutation.isPending}
                        className="h-14 rounded-xl px-8 font-bold text-lg shadow-sm"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {challenge.type === 'daily' && userProgress.days && (
                <Card className="p-6 rounded-[2rem] border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground">Day Progress</h3>
                    {challenge.dailyTargets && challenge.dailyTargets.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setScheduleOpen(true)} className="text-primary hover:text-primary/80 font-bold px-2 rounded-lg">
                        <CalendarDays className="w-4 h-4 mr-1" /> View Schedule
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-1 p-1" style={{ width: 'max-content' }}>
                      {userProgress.days.map((day, idx) => {
                        const isToday = day.date === todayStr;
                        const isSelected = idx === viewIdx;
                        const isPast = day.date < todayStr;
                        return (
                          <button
                            key={day.date}
                            onClick={() => setSelectedDayIdx(idx === todayDayIdx ? null : idx)}
                            className={`flex flex-col items-center gap-1.5 w-[52px] p-2 rounded-xl transition-all cursor-pointer shrink-0
                              ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary'}
                            `}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-colors
                              ${day.target === 0 ? 'bg-gray-100 text-gray-400' : day.completed ? 'bg-primary text-primary-foreground shadow-md' : day.logged > 0 ? 'bg-primary/20 text-primary' : isPast ? 'bg-red-100 text-red-400' : 'bg-secondary text-muted-foreground'}
                            `}>
                              {day.target === 0 ? 'R' : day.completed ? <CheckCircle2 className="w-4 h-4" /> : (day.logged > 0 ? Math.round((day.logged / day.target) * 100) + '%' : (day.target < 100 ? day.target : ''))}
                            </div>
                            <span className={`text-[10px] font-bold uppercase leading-tight ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                              {isToday ? 'Now' : new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </span>
                            <span className={`text-[9px] font-semibold leading-none ${isToday ? 'text-primary' : 'text-muted-foreground/70'}`}>
                              {formatDayDate(day.date)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}
           </div>

           <div className="space-y-6">
              <Card className="p-6 rounded-[2rem] border shadow-sm bg-card/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl flex items-center gap-2"><Trophy className="w-6 h-6 text-primary" /> Leaderboard</h3>
                  <Button variant="ghost" size="sm" onClick={() => setLocation(`/challenge/${challenge.slug || id}/leaderboard`)} className="text-primary hover:text-primary/80 font-bold px-2 rounded-lg">
                    See All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                <div className="space-y-5">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div key={entry.userId} className="flex items-center gap-3 group cursor-pointer" onClick={() => setLocation(`/challenge/${challenge.slug || id}/leaderboard`)}>
                      <div className={`w-6 text-center font-black text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        {entry.rank || '-'}
                      </div>
                      <Avatar className="w-10 h-10 border-2 shadow-sm transition-transform group-hover:scale-105">
                        {entry.profileImageUrl ? <AvatarImage src={entry.profileImageUrl} /> : <AvatarFallback className="bg-secondary font-bold text-sm">{entry.userName?.charAt(0) || 'U'}</AvatarFallback>}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate leading-none mb-1">{entry.userName || 'Unknown'}</div>
                        <div className="text-sm font-semibold text-muted-foreground leading-none">{entry.totalLogged} {challenge.unit}</div>
                      </div>
                      {entry.streak > 0 && <div className="text-sm font-black text-orange-500 flex items-center bg-orange-100 px-2 py-0.5 rounded-md"><Flame className="w-3 h-3 mr-1" /> {entry.streak}</div>}
                    </div>
                  ))}
                  {leaderboard.length === 0 && <div className="text-sm font-semibold text-muted-foreground text-center py-6">No participants yet</div>}
                </div>
              </Card>
           </div>
        </div>
      </div>

      {challenge.dailyTargets && challenge.dailyTargets.length > 0 && (
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="max-w-md rounded-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-xl font-black tracking-tight">{challenge.title} Schedule</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Day-by-day breakdown of targets for this challenge
              </DialogDescription>
            </DialogHeader>
            <ul className="flex-1 overflow-y-auto px-6 pt-2 pb-2 space-y-2" role="list">
              {challenge.dailyTargets.map((target, idx) => {
                const progressDay = userProgress.days?.[idx];
                let dayDate: Date;
                let dateStr: string;
                if (progressDay?.date) {
                  dateStr = progressDay.date;
                  dayDate = new Date(progressDay.date + 'T00:00:00');
                } else {
                  const startParts = challenge.startDate.slice(0, 10);
                  dayDate = new Date(startParts + 'T00:00:00');
                  dayDate.setDate(dayDate.getDate() + idx);
                  dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                }
                const isToday = dateStr === todayStr;
                const isRest = target === 0;
                const isPast = dateStr < todayStr;
                const isCompleted = progressDay?.completed === true;

                return (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all list-none
                      ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                      ${isRest ? 'bg-muted/50' : 'bg-secondary/30'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0
                      ${isRest ? 'bg-muted text-muted-foreground' : isCompleted ? 'bg-green-100 text-green-600' : isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}
                    `}>
                      {isCompleted && !isRest ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isToday ? 'text-primary' : ''}`}>Day {idx + 1}</span>
                        {isToday && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md uppercase">Today</span>}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      {isRest ? (
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">Rest Day</span>
                      ) : (
                        <span className={`text-sm font-black ${isCompleted ? 'text-green-600' : isPast && !isCompleted ? 'text-red-400' : ''}`}>
                          {target} {challenge.unit}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <DialogFooter className="px-6 py-4 border-t bg-secondary/20">
              <div className="w-full flex justify-between text-sm font-bold text-muted-foreground">
                <span>{challenge.dailyTargets.filter(t => t > 0).length} active days</span>
                <span>{challenge.dailyTargets.reduce((sum, t) => sum + t, 0)} total {challenge.unit}</span>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  )
}
