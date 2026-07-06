import Link from "next/link";
import { Bot, LineChart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-serif text-lg font-bold">Trader AI</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
            <Link href="/ai-studio" className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1">
              AI Studio <Sparkles className="h-3 w-3 text-primary" />
            </Link>
            <Link href="/options" className="transition-colors hover:text-foreground/80 text-foreground/60">Options</Link>
          </nav>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">Login</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
