import { useLocation, useRoute } from "wouter";
import { usePreviewChallenge, useJoinChallenge, getPreviewChallengeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Clock, Users, Trophy } from "lucide-react";
import { formatActivityName } from "@/lib/constants";
import { toast } from "sonner";
import { Layout } from "@/components/layout";

export default function ChallengeJoin() {
  const [, params] = useRoute('/join/:inviteCode');
  const inviteCode = params?.inviteCode;
  const [, setLocation] = useLocation();
  const { isAuthenticated, login, isLoading: isAuthLoading } = useAuth();
  
  const { data: preview, isLoading } = usePreviewChallenge(inviteCode as string, { 
    query: { enabled: !!inviteCode, queryKey: getPreviewChallengeQueryKey(inviteCode as string) } 
  });
  
  const joinMutation = useJoinChallenge();

  const handleJoin = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('join_redirect', `/join/${inviteCode}`);
      login();
      return;
    }
    
    joinMutation.mutate({ inviteCode: inviteCode as string }, {
      onSuccess: (res) => {
        toast.success("Joined challenge successfully!");
        setLocation(`/challenge/${res.challengeId}`);
      },
      onError: () => {
        toast.error("Failed to join challenge. You might already be a participant.");
        setLocation("/");
      }
    });
  };

  if (isLoading || isAuthLoading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </Layout>
  );
  
  if (!preview) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center text-xl font-bold">Invalid invite link</div>
    </Layout>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background items-center justify-center px-4 py-8">
       <div className="max-w-md w-full">
         <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">You've been invited!</h1>
            <p className="text-xl text-muted-foreground font-medium">Join this challenge to start tracking together.</p>
         </div>
         
         <Card className="p-8 rounded-[2rem] border shadow-xl bg-card text-center mb-8">
            <h2 className="text-3xl font-black mb-8">{preview.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-secondary rounded-2xl p-5 flex flex-col items-center justify-center">
                  <Activity className="w-6 h-6 mb-3 text-primary" />
                  <div className="font-bold text-base">{formatActivityName(preview.activityType)}</div>
                  <div className="text-sm font-semibold text-muted-foreground capitalize">{preview.type} goal</div>
               </div>
               <div className="bg-secondary rounded-2xl p-5 flex flex-col items-center justify-center">
                  <Clock className="w-6 h-6 mb-3 text-primary" />
                  <div className="font-bold text-base">{preview.durationDays} Days</div>
                  <div className="text-sm font-semibold text-muted-foreground">Duration</div>
               </div>
               <div className="bg-secondary rounded-2xl p-5 flex flex-col items-center justify-center col-span-2">
                  <Users className="w-6 h-6 mb-3 text-primary" />
                  <div className="font-bold text-base">{preview.participantCount} Participants</div>
                  <div className="text-sm font-semibold text-muted-foreground">Already joined</div>
               </div>
            </div>
            
            <Button onClick={handleJoin} disabled={joinMutation.isPending} size="lg" className="w-full h-16 text-xl font-black rounded-2xl shadow-lg">
              {joinMutation.isPending ? "Joining..." : (isAuthenticated ? "Join Challenge" : "Log in to Join")}
            </Button>
         </Card>
       </div>
    </div>
  )
}
