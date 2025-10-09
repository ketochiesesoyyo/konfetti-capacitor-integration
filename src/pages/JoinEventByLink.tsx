import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

const JoinEventByLink = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const [side, setSide] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Mock event data - will be fetched from backend using the code
  const event = {
    id: "1",
    coupleName: "Sarah & James",
    eventDate: "2025-11-15",
    theme: "sunset",
    guestCount: 47,
    isValid: true,
  };

  const getThemeClass = (theme: string) => {
    const themes = {
      sunset: "gradient-sunset",
      ocean: "gradient-ocean",
      golden: "gradient-golden",
      emerald: "gradient-emerald",
      midnight: "gradient-midnight",
    };
    return themes[theme as keyof typeof themes] || themes.sunset;
  };

  const handleJoin = async () => {
    if (!side) {
      toast.error("Please select which side you're on");
      return;
    }

    setIsJoining(true);
    
    // Mock join - will call backend
    setTimeout(() => {
      // Show champagne animation (mock)
      toast.success("🥂 Welcome to the wedding!", {
        description: `You've joined ${event.coupleName}'s celebration`,
      });
      
      // Redirect to complete profile or home
      navigate("/");
      setIsJoining(false);
    }, 1000);
  };

  if (!event.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Invalid Event Link</h2>
          <p className="text-muted-foreground mb-6">
            This event doesn't exist or the link has expired.
          </p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Theme */}
      <div className={`${getThemeClass(event.theme)} text-white p-8 pb-16`}>
        <div className="max-w-lg mx-auto text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold mb-2">{event.coupleName}</h1>
          <p className="text-white/90 text-lg">You're Invited!</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <Card className="p-6 space-y-6 shadow-xl">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Wedding Date</p>
                <p className="text-sm">
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Guests Joined</p>
                <p className="text-sm">{event.guestCount} singles ready to mingle</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-center">
                <strong className="text-foreground">Plus One</strong> creates a private matchmaking
                space for wedding guests. Swipe, match, and chat with other attendees!
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Which side are you on?</label>
                <Select value={side} onValueChange={setSide}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  <strong>18+ Only:</strong> This app is intended for adults only
                </p>
              </div>

              <Button
                variant="gradient"
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={!side || isJoining}
              >
                {isJoining ? "Joining..." : "Join Wedding 🎊"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Event Code: <span className="font-mono font-semibold">{code}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JoinEventByLink;
