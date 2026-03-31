import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 md:p-12 rounded-[2rem] border shadow-xl bg-card text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight mb-4 text-foreground">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-10 font-medium">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-md">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
