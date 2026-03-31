import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Plus, User, Home } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="h-16 border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
          <Link href="/?home=1" className="font-bold text-xl tracking-tight flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            Get Better Together
          </Link>
          
          <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setLocation('/?home=1')}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setLocation('/challenge/new')}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setLocation('/profile')}>
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
