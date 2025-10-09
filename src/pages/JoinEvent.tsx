import { useState } from "react";
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

const JoinEvent = () => {
  const navigate = useNavigate();
  const [eventCode, setEventCode] = useState("");
  const [side, setSide] = useState("");

  const handleJoin = () => {
    if (!eventCode || !side) {
      toast.error("Please enter event code and select a side");
      return;
    }

    // Mock join success
    toast.success("Joined wedding! 🎉", {
      description: "Welcome to Sarah & James Wedding",
    });
    
    // Navigate to profile if incomplete, otherwise to home
    navigate("/");
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
            <p className="text-sm text-muted-foreground">
              Enter the unique code from your wedding invite
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Event Code</Label>
              <Input
                id="code"
                placeholder="e.g., SARAH-JAMES-2025"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-wider"
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
