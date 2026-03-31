import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Plus, User, LogOut, Home } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="h-16 border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
          <Link href="/?home=1" className="font-bold text-sm sm:text-xl tracking-tight flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            Get Better Together
          </Link>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setLocation('/?home=1')}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setLocation('/challenge/new')}>
              <Plus className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <div className="px-2 py-2 text-sm font-medium opacity-70 truncate border-b mb-1">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'My Account'}
                </div>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer rounded-lg">
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
