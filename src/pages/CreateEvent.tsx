import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(true);
  const [isPaid] = useState(false); // Will be connected to real payment state
  const [step, setStep] = useState(1);
  
  const [eventData, setEventData] = useState({
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
    closeDate: "",
    theme: "sunset",
    agreedToTerms: false,
  });

  const themes = [
    { id: "sunset", name: "Sunset Blush", gradient: "gradient-sunset" },
    { id: "ocean", name: "Ocean Breeze", gradient: "gradient-ocean" },
    { id: "golden", name: "Golden Hour", gradient: "gradient-golden" },
    { id: "emerald", name: "Emerald Fizz", gradient: "gradient-emerald" },
    { id: "midnight", name: "Midnight Rose", gradient: "gradient-midnight" },
  ];

  const handlePayment = () => {
    toast.success("Payment successful! 🎉");
    setShowPaywall(false);
  };

  const handleCreateEvent = () => {
    toast.success("Event created! 🎊", {
      description: "Your wedding matchmaking space is ready!",
    });
    navigate("/");
  };

  if (showPaywall && !isPaid) {
    return (
      <Dialog open={showPaywall} onOpenChange={(open) => !open && navigate("/")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Your Event</DialogTitle>
            <DialogDescription>
              Unlock private matchmaking for your wedding guests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="gradient-sunset rounded-lg p-6 text-white">
              <p className="text-3xl font-bold mb-2">$14.99</p>
              <p className="text-sm opacity-90">One-time payment per event</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Unlimited Guests</p>
                  <p className="text-sm text-muted-foreground">
                    Share your event link with all wedding attendees
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">3 Days Active</p>
                  <p className="text-sm text-muted-foreground">
                    Event stays active up to 3 days after your wedding
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Guest Management</p>
                  <p className="text-sm text-muted-foreground">
                    Full control over who joins your event
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={handlePayment}
            >
              Purchase & Continue
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <h1 className="text-2xl font-bold">Create Event</h1>
            <p className="text-white/90 text-sm">Step {step} of 2</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 ? (
          <Card className="p-6 space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="couple1">First Person's Name</Label>
              <Input
                id="couple1"
                placeholder="e.g., Sarah"
                value={eventData.coupleName1}
                onChange={(e) =>
                  setEventData({ ...eventData, coupleName1: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couple2">Second Person's Name</Label>
              <Input
                id="couple2"
                placeholder="e.g., James"
                value={eventData.coupleName2}
                onChange={(e) =>
                  setEventData({ ...eventData, coupleName2: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <div className="relative">
                <Input
                  id="eventDate"
                  type="date"
                  value={eventData.eventDate}
                  onChange={(e) =>
                    setEventData({ ...eventData, eventDate: e.target.value })
                  }
                />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeDate">Close Date (Max 3 days after event)</Label>
              <Input
                id="closeDate"
                type="date"
                value={eventData.closeDate}
                onChange={(e) =>
                  setEventData({ ...eventData, closeDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={eventData.theme}
                onValueChange={(value) =>
                  setEventData({ ...eventData, theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${theme.gradient}`} />
                        {theme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={eventData.agreedToTerms}
                onCheckedChange={(checked) =>
                  setEventData({ ...eventData, agreedToTerms: checked as boolean })
                }
              />
              <Label htmlFor="terms" className="text-sm leading-tight">
                I confirm all guests will be 18+ and agree to the Terms of Service
              </Label>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={() => setStep(2)}
              disabled={
                !eventData.coupleName1 ||
                !eventData.coupleName2 ||
                !eventData.eventDate ||
                !eventData.closeDate ||
                !eventData.agreedToTerms
              }
            >
              Next
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">Review Your Event</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Couple</p>
                <p className="font-medium">
                  {eventData.coupleName1} & {eventData.coupleName2}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-medium">
                  {new Date(eventData.eventDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Close Date</p>
                <p className="font-medium">
                  {new Date(eventData.closeDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`h-12 w-full rounded-lg ${
                      themes.find((t) => t.id === eventData.theme)?.gradient
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="gradient"
                onClick={handleCreateEvent}
                className="flex-1"
              >
                Create Event
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
