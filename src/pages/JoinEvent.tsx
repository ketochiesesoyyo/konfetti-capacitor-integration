import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const JoinEvent = () => {
  const navigate = useNavigate();
  const [eventCode, setEventCode] = useState("");
  const [side, setSide] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleJoin = async () => {
    if (!eventCode || !side || !userId) {
      toast.error("Please enter event code and select a side");
      return;
    }

    const normalizedCode = eventCode.toUpperCase().trim();
    
    // Check if event exists
    const { data: event, error } = await supabase
      .from("events")
      .select("id")
      .eq("invite_code", normalizedCode)
      .single();

    if (error || !event) {
      toast.error("Invalid event code");
      return;
    }
    
    // Redirect to the link-based join flow with the validated code
    navigate(`/join/${normalizedCode}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Join Event</h1>
            <p className="text-white/90 text-sm">Enter your wedding invite code</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="p-6 space-y-6">
          <div className="text-center">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Join a Wedding</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Enter the unique code from your wedding invite
            </p>
            <p className="text-xs text-muted-foreground">
              Received a link? Just click it to join instantly!
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Event Code</Label>
              <Input
                id="code"
                placeholder="e.g., ABC123 or SARAH-JAMES-2025"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-wider font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Which side are you on?</Label>
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
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">18+ Only:</strong> This app is intended for adults only
            </p>
          </div>

          <Button
            variant="gradient"
            className="w-full"
            size="lg"
            onClick={handleJoin}
            disabled={!eventCode || !side}
          >
            Join Wedding
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default JoinEvent;
