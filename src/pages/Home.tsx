import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Settings, LogOut, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"attending" | "hosting">("attending");
  const [hostingEvents, setHostingEvents] = useState<any[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedEventToLeave, setSelectedEventToLeave] = useState<any>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }
        
        setUserId(session.user.id);
        
        // Fetch events user is hosting
        const { data: hosting, error: hostingError } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", session.user.id)
          .order("date", { ascending: true });

        if (hostingError) throw hostingError;
        setHostingEvents(hosting || []);

        // Fetch events user is attending (joined via event_attendees)
        // Query events directly - invite codes will be masked in UI for non-creators
        const { data: attending, error: attendingError } = await supabase
          .from("event_attendees")
          .select("event_id, events(*)")
          .eq("user_id", session.user.id);

        if (attendingError) throw attendingError;
        
        // Mask invite codes and filter out events where close_date has passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendingEventsData = (attending || [])
          .filter((a: any) => {
            if (!a.events?.close_date) return true;
            const closeDate = new Date(a.events.close_date);
            closeDate.setHours(0, 0, 0, 0);
            return closeDate >= today;
          })
          .map((a: any) => ({
            ...a.events,
            invite_code: a.events.created_by === session.user.id ? a.events.invite_code : null
          }));
        setAttendingEvents(attendingEventsData);
        
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEvents();
  }, [navigate]);

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

  const handleCreateEvent = () => {
    // Show paywall modal - will be implemented with real payment flow
    navigate("/create-event");
  };

  const handleLeaveEvent = async () => {
    if (!selectedEventToLeave || !userId) return;

    try {
      // Log the departure with reason
      const { error: logError } = await supabase
        .from("event_departures")
        .insert({
          user_id: userId,
          event_id: selectedEventToLeave.id,
          reason: leaveReason || null,
        });

      if (logError) throw logError;

      // Remove user from event attendees
      const { error: deleteError } = await supabase
        .from("event_attendees")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", selectedEventToLeave.id);

      if (deleteError) throw deleteError;

      toast.success("You've left the event");
      
      // Refresh the events list
      setAttendingEvents(prev => prev.filter(e => e.id !== selectedEventToLeave.id));
      setLeaveDialogOpen(false);
      setSelectedEventToLeave(null);
      setLeaveReason("");
    } catch (error: any) {
      console.error("Error leaving event:", error);
      toast.error("Failed to leave event");
    }
  };

  // Sort and filter hosting events
  const getSortedAndFilteredHostingEvents = () => {
    let filtered = hostingEvents;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(event => event.status === filterStatus);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "status":
          return (a.status || "active").localeCompare(b.status || "active");
        default:
          return 0;
      }
    });

    return sorted;
  };

  const displayedHostingEvents = getSortedAndFilteredHostingEvents();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1 text-[hsl(var(--title))]">My Weddings</h1>
          <p className="text-sm text-[hsl(var(--subtitle))]">Find your perfect match at every celebration</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("attending")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "attending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              I'm Attending
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "hosting"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              I'm Hosting
            </button>
          </div>
        </Card>

        {/* Events List */}
        <div className="space-y-4 pb-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading events...</p>
            </Card>
          ) : activeTab === "attending" ? (
            attendingEvents.length > 0 ? (
              attendingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={event.status === 'closed' ? 'secondary' : 'default'}
                        className={event.status === 'closed' ? 'bg-yellow-500 text-yellow-950' : ''}
                      >
                        {event.status === 'closed' ? 'Closed' : 'Active'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/matchmaking/${event.id}`)}
                      >
                        Open Event
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedEventToLeave(event);
                          setLeaveDialogOpen(true);
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Join a wedding using an invite link from your hosts!
                </p>
                <Button variant="outline" onClick={() => navigate("/join-event")}>
                  Enter Event Code
                </Button>
              </Card>
            )
          ) : hostingEvents.length > 0 ? (
            <>
              {/* Sort and Filter Controls */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="status">Sort by Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="closed">Closed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {displayedHostingEvents.length > 0 ? (
                displayedHostingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{event.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={event.status === 'closed' ? 'secondary' : 'default'}
                      className={event.status === 'closed' ? 'bg-yellow-500 text-yellow-950' : ''}
                    >
                      {event.status === 'closed' ? 'Closed' : 'Active'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Invite code: <span className="font-mono font-semibold">{event.invite_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/event-dashboard/${event.id}`)}
                    >
                      Manage Event
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(event.invite_code);
                        toast.success("Invite code copied!");
                      }}
                    >
                      Copy Code
                    </Button>
                  </div>
                </div>
              </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No {filterStatus === "all" ? "" : filterStatus} events found
                  </p>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any events yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a private matchmaking space for your wedding guests
              </p>
            </Card>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 flex flex-col gap-3">
          <Button
            size="lg"
            className="shadow-xl bg-primary text-white border-primary"
            onClick={handleCreateEvent}
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="shadow-xl bg-background"
            onClick={() => navigate("/join-event")}
          >
            Join Event
          </Button>
        </div>
      </div>

      {/* Leave Event Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Event?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong className="text-foreground">Warning:</strong> If you leave this event, all your chats and matches from this event will be removed from your view.
              </p>
              <p className="text-xs">
                For security and safety reasons, a copy of your chats and matches will be retained by the platform.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="leave-reason">Why are you leaving? (Optional)</Label>
            <Textarea
              id="leave-reason"
              placeholder="Let us know your reason..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setLeaveReason("");
              setSelectedEventToLeave(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
