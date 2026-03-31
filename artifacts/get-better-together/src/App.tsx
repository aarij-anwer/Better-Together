import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/auth-guard";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ChallengeDetail from "@/pages/challenge-detail";
import ChallengeNew from "@/pages/challenge-new";
import ChallengeJoin from "@/pages/challenge-join";
import ChallengeLeaderboard from "@/pages/challenge-leaderboard";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile">{() => <AuthGuard><Profile /></AuthGuard>}</Route>
      <Route path="/challenge/new">{() => <AuthGuard><ChallengeNew /></AuthGuard>}</Route>
      <Route path="/challenge/:id">{() => <AuthGuard><ChallengeDetail /></AuthGuard>}</Route>
      <Route path="/challenge/:id/leaderboard">{() => <AuthGuard><ChallengeLeaderboard /></AuthGuard>}</Route>
      <Route path="/join/:inviteCode" component={ChallengeJoin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
