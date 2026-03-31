import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ChallengeDetail from "@/pages/challenge-detail";
import ChallengeNew from "@/pages/challenge-new";
import ChallengeJoin from "@/pages/challenge-join";
import ChallengeLeaderboard from "@/pages/challenge-leaderboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/challenge/new" component={ChallengeNew} />
      <Route path="/challenge/:id" component={ChallengeDetail} />
      <Route path="/challenge/:id/leaderboard" component={ChallengeLeaderboard} />
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
