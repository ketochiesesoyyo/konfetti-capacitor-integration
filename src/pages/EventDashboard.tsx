import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, MessageCircle, UserX, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EventDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"guests" | "stats" | "settings">("guests");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState("");

  // Mock data
  const guests = [
    {
      id: "1",
      name: "Emma Wilson",
      side: "Bride",
      profileComplete: true,
      active: true,
      avatar: "/placeholder.svg",
    },
    {
      id: "2",
      name: "Michael Chen",
      side: "Groom",
      profileComplete: true,
      active: true,
      avatar: "/placeholder.svg",
    },
    {
      id: "3",
      name: "Sophie Martin",
      side: "Bride",
      profileComplete: false,
      active: false,
      avatar: "/placeholder.svg",
    },
  ];

  const stats = {
    totalGuests: 47,
    profileCompleted: 89,
    totalLikes: 234,
    matchesCreated: 18,
    topActive: [
      { name: "Emma Wilson", swipes: 45 },
      { name: "Michael Chen", swipes: 38 },
      { name: "Jake Stevens", swipes: 32 },
    ],
  };

  const handleRemoveGuest = () => {
    if (!removalReason) {
      toast.error("Please select a reason");
      return;
    }
    toast.success(`${selectedGuest.name} has been removed`);
    setRemoveDialogOpen(false);
    setSelectedGuest(null);
    setRemovalReason("");
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText("https://plusone.app/join/SARAH-JAMES-2025");
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sarah & James</h1>
              <p className="text-white/90 text-sm">Event Dashboard</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleShareLink}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Event Link
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-3 gap-1">
            {["guests", "stats", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "py-2 px-3 rounded-lg font-medium transition-all text-sm capitalize",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        {activeTab === "guests" && (
          <div className="space-y-3 pb-6">
            {guests.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden gradient-sunset flex-shrink-0">
                    <img src={guest.avatar} alt={guest.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{guest.name}</h3>
                      {guest.active && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {guest.side}'s side
                      </Badge>
                      {guest.profileComplete ? (
                        <span className="text-xs text-green-600">✓ Complete</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Incomplete</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setRemoveDialogOpen(true);
                      }}
                    >
                      <UserX className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4 pb-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.totalGuests}</p>
                  <p className="text-sm text-muted-foreground">Total Guests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.profileCompleted}%</p>
                  <p className="text-sm text-muted-foreground">Profiles Complete</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.matchesCreated}</p>
                  <p className="text-sm text-muted-foreground">Matches Created</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Most Active Guests</h3>
              <div className="space-y-3">
                {stats.topActive.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{guest.name}</span>
                    <Badge variant="secondary">{guest.swipes} swipes</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4 pb-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Event Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Event Theme</p>
                  <div className="h-16 rounded-lg gradient-sunset" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Event Date</p>
                  <p className="text-sm text-muted-foreground">November 15, 2025</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Close Date</p>
                  <p className="text-sm text-muted-foreground">November 18, 2025</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-destructive/50">
              <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Close the event early. Matches and chats will remain.
              </p>
              <Button variant="destructive" className="w-full">
                Close Event Now
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Remove Guest Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Guest</DialogTitle>
            <DialogDescription>
              This will delete all their matches and chats for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for removal</Label>
              <Select value={removalReason} onValueChange={setRemovalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-invited">Not invited to the wedding</SelectItem>
                  <SelectItem value="duplicate">Duplicate profile</SelectItem>
                  <SelectItem value="fake-info">Incorrect or fake info</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="behavior">Behavior issues</SelectItem>
                  <SelectItem value="not-attending">No longer attending</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRemoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRemoveGuest}
              >
                Remove Guest
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDashboard;
