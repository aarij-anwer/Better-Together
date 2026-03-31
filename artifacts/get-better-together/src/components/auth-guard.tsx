import { useAuth } from "@workspace/replit-auth-web";
import { Activity } from "lucide-react";
import { Layout } from "./layout";
import { Button } from "./ui/button";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">Sign in to continue</h2>
            <p className="text-muted-foreground mb-6 font-medium">You need to be signed in to access this page.</p>
            <Button size="lg" className="w-full rounded-2xl h-14 font-bold text-lg" onClick={() => login()}>
              Sign in with Replit
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
