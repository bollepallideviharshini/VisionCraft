import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Terminal, Image, Globe, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            VisionCraft
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link to="/library">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8">
                  <Image className="h-3.5 w-3.5" />
                  Library
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8">
                  <Globe className="h-3.5 w-3.5" />
                  Explore
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground h-8 w-8">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 rounded-md">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
