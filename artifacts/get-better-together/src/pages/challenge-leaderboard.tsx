import { useLocation, useRoute } from "wouter";
import { useGetChallenge, useGetLeaderboard, getGetChallengeQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, ArrowLeft, Trophy, Flame, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function ChallengeLeaderboard() {
  const [, params] = useRoute('/challenge/:id/leaderboard');
  const id = params?.id;
  const [, setLocation] = useLocation();
  
  const { data: challengeData, isLoading: isChallengeLoading } = useGetChallenge(id as string, { 
    query: { enabled: !!id, queryKey: getGetChallengeQueryKey(id as string) } 
  });
  
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useGetLeaderboard(id as string, {
    query: { enabled: !!id, queryKey: getGetLeaderboardQueryKey(id as string) }
  });
  
  if (isChallengeLoading || isLeaderboardLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );
  
  if (!challengeData || !leaderboard) return (
    <Layout>
      <div className="p-8 text-center text-xl font-bold">Challenge not found</div>
    </Layout>
  );

  const { challenge } = challengeData;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-8">
         <Button variant="ghost" onClick={() => setLocation(`/challenge/${id}`)} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground font-bold">
           <ArrowLeft className="w-5 h-5 mr-2" /> Back to Challenge
         </Button>
         
         <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
              <p className="text-muted-foreground font-bold">{challenge.title}</p>
            </div>
         </div>
         
         <div className="space-y-4">
           {leaderboard.map((entry, idx) => (
             <Card key={entry.userId} className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm transition-all hover:shadow-md ${idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200' : idx === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent border-gray-200' : idx === 2 ? 'bg-gradient-to-r from-amber-50 to-transparent border-amber-200' : 'bg-card'}`}>
               <div className={`w-8 text-center font-black text-2xl ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                 {entry.rank}
               </div>
               
               <Avatar className="w-14 h-14 border-4 border-background shadow-md">
                 {entry.profileImageUrl ? <AvatarImage src={entry.profileImageUrl} /> : <AvatarFallback className="bg-secondary font-bold text-lg">{entry.userName?.charAt(0) || 'U'}</AvatarFallback>}
               </Avatar>
               
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between mb-2">
                   <div className="font-bold text-xl truncate pr-4">{entry.userName || 'Unknown'}</div>
                   <div className="font-black text-xl whitespace-nowrap">{entry.totalLogged} <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{challenge.unit}</span></div>
                 </div>
                 <div className="flex items-center gap-3">
                   <Progress value={entry.percentComplete} className={`h-2.5 rounded-full flex-1 ${idx === 0 ? '[&>div]:bg-yellow-500 bg-yellow-100' : idx === 1 ? '[&>div]:bg-gray-400 bg-gray-100' : idx === 2 ? '[&>div]:bg-amber-600 bg-amber-100' : ''}`} />
                   <span className="text-xs font-bold text-muted-foreground w-10 text-right">{Math.round(entry.percentComplete)}%</span>
                 </div>
               </div>
               
               {entry.streak > 0 && (
                 <div className="hidden sm:flex flex-col items-center justify-center bg-orange-100 text-orange-600 px-3 py-2 rounded-xl min-w-[60px]">
                   <Flame className="w-5 h-5 mb-0.5" />
                   <span className="font-black text-sm">{entry.streak}</span>
                 </div>
               )}
             </Card>
           ))}
           
           {leaderboard.length === 0 && (
             <div className="text-center py-20 bg-card rounded-3xl border border-dashed">
               <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
               <h3 className="text-xl font-bold mb-2">No participants yet</h3>
               <p className="text-muted-foreground font-medium">Invite friends to see them on the leaderboard.</p>
             </div>
           )}
         </div>
      </div>
    </Layout>
  )
}
