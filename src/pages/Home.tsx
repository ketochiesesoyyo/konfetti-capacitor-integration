import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Settings, LogOut, Filter, ArrowUpDown, ImageIcon, Eye, EyeOff, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"attending" | "hosting">("attending");
  const [hostingEvents, setHostingEvents] = useState<any[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedEventToLeave, setSelectedEventToLeave] = useState<any>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "active" | "closed">("all");
  const [attendingSortBy, setAttendingSortBy] = useState<"name" | "date" | "status">("date");
  const [attendingFilterStatus, setAttendingFilterStatus] = useState<"all" | "active" | "closed">("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }
        
        setUserId(session.user.id);
        
        // Fetch hidden events
        const { data: hiddenData, error: hiddenError } = await supabase
          .from("hidden_events")
          .select("event_id")
          .eq("user_id", session.user.id);
        
        if (hiddenError) throw hiddenError;
        setHiddenEventIds(new Set(hiddenData?.map(h => h.event_id) || []));
        
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
            // Filter out events where user is the host
            if (a.events?.created_by === session.user.id) return false;
            
            if (!a.events?.close_date) return true;
            const closeDate = new Date(a.events.close_date);
            closeDate.setHours(0, 0, 0, 0);
            return closeDate >= today;
          })
          .map((a: any) => ({
            ...a.events,
            invite_code: null // Attendees never see invite codes
          }));
        setAttendingEvents(attendingEventsData);
        
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast.error(t('home.failedLoad'));
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

      toast.success(t('home.leftEvent'));
      
      // Refresh the events list
      setAttendingEvents(prev => prev.filter(e => e.id !== selectedEventToLeave.id));
      setLeaveDialogOpen(false);
      setSelectedEventToLeave(null);
      setLeaveReason("");
    } catch (error: any) {
      console.error("Error leaving event:", error);
      toast.error(t('home.failedLeave'));
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

  // Sort and filter attending events
  const getSortedAndFilteredAttendingEvents = () => {
    let filtered = attendingEvents;

    // Filter out draft events - attendees should never see drafts
    filtered = filtered.filter(event => event.status !== 'draft');

    // Apply status filter (no draft option for attending)
    if (attendingFilterStatus !== "all") {
      filtered = filtered.filter(event => event.status === attendingFilterStatus);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (attendingSortBy) {
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

  const displayedAttendingEvents = getSortedAndFilteredAttendingEvents();

  const handleToggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleHideSelected = async () => {
    if (!userId || selectedEvents.size === 0) return;

    try {
      const eventsToHide = Array.from(selectedEvents);
      const { error } = await supabase
        .from("hidden_events")
        .insert(
          eventsToHide.map(eventId => ({
            user_id: userId,
            event_id: eventId,
          }))
        );

      if (error) throw error;

      setHiddenEventIds(prev => new Set([...prev, ...eventsToHide]));
      setSelectedEvents(new Set());
      setSelectionMode(false);
      toast.success(t('home.hiddenEvents', { count: eventsToHide.length }));
    } catch (error: any) {
      console.error("Error hiding events:", error);
      toast.error(t('home.failedHide'));
    }
  };

  const handleUnhideSelected = async () => {
    if (!userId || selectedEvents.size === 0) return;

    try {
      const eventsToUnhide = Array.from(selectedEvents);
      const { error } = await supabase
        .from("hidden_events")
        .delete()
        .eq("user_id", userId)
        .in("event_id", eventsToUnhide);

      if (error) throw error;

      setHiddenEventIds(prev => {
        const newSet = new Set(prev);
        eventsToUnhide.forEach(id => newSet.delete(id));
        return newSet;
      });
      setSelectedEvents(new Set());
      setSelectionMode(false);
      toast.success(t('home.unhiddenEvents', { count: eventsToUnhide.length }));
    } catch (error: any) {
      console.error("Error unhiding events:", error);
      toast.error(t('home.failedUnhide'));
    }
  };

  const getVisibleEvents = (events: any[]) => {
    if (showHidden) {
      return events.filter(e => hiddenEventIds.has(e.id));
    }
    return events.filter(e => !hiddenEventIds.has(e.id));
  };

  const visibleAttendingEvents = getVisibleEvents(displayedAttendingEvents);
  const visibleHostingEvents = getVisibleEvents(displayedHostingEvents);

  // Calculate hidden event counts per tab
  const hiddenAttendingCount = displayedAttendingEvents.filter(e => hiddenEventIds.has(e.id)).length;
  const hiddenHostingCount = displayedHostingEvents.filter(e => hiddenEventIds.has(e.id)).length;
  const currentTabHiddenCount = activeTab === "attending" ? hiddenAttendingCount : hiddenHostingCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <KonfettiLogo className="w-32 h-auto mb-1" />
          <p className="text-sm text-subtitle">{t('home.tagline')}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Tab Selector */}
        <Card className="p-1.5 mb-6 shadow-soft">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("attending")}
              className={cn(
                "py-3 px-5 rounded-2xl font-semibold transition-all duration-300 text-sm",
                activeTab === "attending"
                  ? "bg-primary text-primary-foreground shadow-soft scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              {t('home.attending')} ({visibleAttendingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={cn(
                "py-3 px-5 rounded-2xl font-semibold transition-all duration-300 text-sm",
                activeTab === "hosting"
                  ? "bg-primary text-primary-foreground shadow-soft scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              {t('home.hosting')} ({visibleHostingEvents.length})
            </button>
          </div>
        </Card>

        {/* Selection Controls */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedEvents(new Set());
            }}
          >
            {selectionMode ? t('common.cancel') : t('common.select')}
          </Button>
          
          {selectionMode && selectedEvents.size > 0 && (
            <>
              {!showHidden ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHideSelected}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  {t('common.hide')} ({selectedEvents.size})
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnhideSelected}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('common.unhide')} ({selectedEvents.size})
                </Button>
              )}
            </>
          )}

          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowHidden(!showHidden);
              setSelectionMode(false);
              setSelectedEvents(new Set());
            }}
          >
            {showHidden ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {t('home.showActive')}
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                {t('home.showHidden')} ({currentTabHiddenCount})
              </>
            )}
          </Button>
        </div>

        {/* Events List */}
        <div className="space-y-4 pb-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-enter" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-full animate-shimmer" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-3/4 animate-shimmer rounded-2xl" />
                      <div className="h-4 w-1/2 animate-shimmer rounded-2xl" />
                      <div className="h-4 w-1/3 animate-shimmer rounded-2xl" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : activeTab === "attending" ? (
            <>
              {/* Sort and Filter Controls for Attending */}
              {!showHidden && visibleAttendingEvents.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <Select value={attendingSortBy} onValueChange={(value: any) => setAttendingSortBy(value)}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">{t('home.sortByDate')}</SelectItem>
                        <SelectItem value="name">{t('home.sortByName')}</SelectItem>
                        <SelectItem value="status">{t('home.sortByStatus')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={attendingFilterStatus} onValueChange={(value: any) => setAttendingFilterStatus(value)}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('home.allEvents')}</SelectItem>
                        <SelectItem value="active">{t('home.activeOnly')}</SelectItem>
                        <SelectItem value="closed">{t('home.closedOnly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {visibleAttendingEvents.length > 0 ? (
              visibleAttendingEvents.map((event, index) => (
                <Card key={event.id} className={cn("overflow-hidden hover-lift shadow-card animate-enter", `delay-${Math.min(index * 100, 600)}`)}>

                  <div className="flex">
                    {/* Selection Checkbox */}
                    {selectionMode && (
                      <div className="flex items-center justify-center px-3">
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={() => handleToggleEventSelection(event.id)}
                        />
                      </div>
                    )}
                    
                    {/* Event Image - Circular with margin */}
                    <div className="w-28 shrink-0 flex items-center justify-center py-3 pl-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center hover-scale transition-all shadow-soft">
                        {event.image_url ? (
                          <img 
                            src={event.image_url} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {/* Event Content */}
                    <div className="flex-1 p-4 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => !selectionMode && navigate(`/matchmaking/${event.id}`)}
                        >
                          <h3 className="font-semibold text-lg hover:text-primary transition-all active-press cursor-pointer">{event.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            variant="outline"
                            className={event.status === 'closed' 
                              ? 'bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground pointer-events-none' 
                              : 'bg-white text-foreground hover:bg-white hover:text-foreground pointer-events-none'}
                          >
                            {event.status === 'closed' ? 'Closed' : 'Active'}
                          </Badge>
                          
                          {!selectionMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/matchmaking/${event.id}`)}>
                                  Go Matchmaking
                                </DropdownMenuItem>
                                {hiddenEventIds.has(event.id) ? (
                                  <DropdownMenuItem onClick={async () => {
                                    if (!userId) return;
                                    try {
                                      const { error } = await supabase
                                        .from("hidden_events")
                                        .delete()
                                        .eq("user_id", userId)
                                        .eq("event_id", event.id);
                                      if (error) throw error;
                                      setHiddenEventIds(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(event.id);
                                        return newSet;
                                      });
                                      toast.success(t('home.eventShown'));
                                    } catch (error: any) {
                                      console.error("Error showing event:", error);
                                      toast.error(t('home.failedShow'));
                                    }
                                  }}>
                                    {t('home.showEvent')}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={async () => {
                                    if (!userId) return;
                                    try {
                                      const { error } = await supabase
                                        .from("hidden_events")
                                        .insert({ user_id: userId, event_id: event.id });
                                      if (error) throw error;
                                      setHiddenEventIds(prev => new Set([...prev, event.id]));
                                      toast.success(t('home.eventHidden'));
                                    } catch (error: any) {
                                      console.error("Error hiding event:", error);
                                      toast.error(t('home.failedShow'));
                                    }
                                  }}>
                                    {t('home.hideEvent')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedEventToLeave(event);
                                    setLeaveDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  {t('home.leaveEvent')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : showHidden ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No hidden events
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {attendingFilterStatus !== "all" 
                    ? `No ${attendingFilterStatus} events found` 
                    : "Join a wedding using an invite link from your hosts!"}
                </p>
                {attendingFilterStatus === "all" && (
                  <Button variant="outline" onClick={() => navigate("/join-event")}>
                    Enter Event Code
                  </Button>
                )}
              </Card>
            )}
            </>
          ) : visibleHostingEvents.length > 0 || hostingEvents.length > 0 ? (
            <>
              {/* Sort and Filter Controls */}
              {!showHidden && <div className="flex gap-2 mb-4">
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
                      <SelectItem value="draft">Drafts Only</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="closed">Closed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>}

              {visibleHostingEvents.length > 0 ? (
                visibleHostingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex">
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="flex items-center justify-center px-3">
                      <Checkbox
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={() => handleToggleEventSelection(event.id)}
                      />
                    </div>
                  )}
                  
                  {/* Event Image - Circular with margin */}
                  <div className="w-28 shrink-0 flex items-center justify-center py-3 pl-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => !selectionMode && (event.status === 'draft' ? navigate(`/create-event?edit=${event.id}`) : navigate(`/event-dashboard/${event.id}`))}
                      >
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors">{event.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}</span>
                        </div>
                        {event.status !== 'draft' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Code: <span className="font-mono font-semibold">{event.invite_code}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Badge 
                          variant="outline"
                          className={
                            event.status === 'draft'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700 pointer-events-none'
                              : event.status === 'closed' 
                                ? 'bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground pointer-events-none' 
                                : 'bg-white text-foreground hover:bg-white hover:text-foreground pointer-events-none'
                          }
                        >
                          {event.status === 'draft' ? 'Draft' : event.status === 'closed' ? 'Closed' : 'Active'}
                        </Badge>
                        
                        {!selectionMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {event.status === 'draft' ? (
                                <DropdownMenuItem onClick={() => navigate(`/create-event?edit=${event.id}`)}>
                                  Complete Draft
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => navigate(`/event-dashboard/${event.id}`)}>
                                    Manage Event
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(event.invite_code);
                                    toast.success("Invite code copied!");
                                  }}>
                                    Copy Code
                                  </DropdownMenuItem>
                                </>
                              )}
                              {hiddenEventIds.has(event.id) ? (
                                <DropdownMenuItem onClick={async () => {
                                  if (!userId) return;
                                  try {
                                    const { error } = await supabase
                                      .from("hidden_events")
                                      .delete()
                                      .eq("user_id", userId)
                                      .eq("event_id", event.id);
                                    if (error) throw error;
                                    setHiddenEventIds(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(event.id);
                                      return newSet;
                                    });
                                    toast.success("Event shown");
                                  } catch (error: any) {
                                    console.error("Error showing event:", error);
                                    toast.error("Failed to show event");
                                  }
                                }}>
                                  Show Event
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={async () => {
                                  if (!userId) return;
                                  try {
                                    const { error } = await supabase
                                      .from("hidden_events")
                                      .insert({ user_id: userId, event_id: event.id });
                                    if (error) throw error;
                                    setHiddenEventIds(prev => new Set([...prev, event.id]));
                                    toast.success("Event hidden");
                                  } catch (error: any) {
                                    console.error("Error hiding event:", error);
                                    toast.error("Failed to hide event");
                                  }
                                }}>
                                  Hide Event
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Upgrade Button - Full Width Below */}
                {event.status !== 'draft' && event.plan === 'free' && event.status === 'active' && (
                  <div className="px-3 pb-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event-dashboard/${event.id}?tab=settings`);
                      }}
                    >
                      Upgrade to Premium - $299
                    </Button>
                  </div>
                )}
              </Card>
                ))
              ) : showHidden ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No hidden events
                  </p>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No {filterStatus === "all" ? "" : filterStatus} events found
                  </p>
                </Card>
              )}
            </>
          ) : !showHidden ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any events yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a private matchmaking space for your wedding guests
              </p>
            </Card>
          ) : null}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-28 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-lg mx-auto px-4">
            <div className="relative flex justify-end">
              <div className="pointer-events-auto">
                {/* Expanded Action Buttons */}
                <div className={cn(
                  "absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300",
                  fabOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}>
                  <Button
                    size="lg"
                    className="shadow-heavy hover:shadow-glow transition-all duration-300 hover-scale bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground whitespace-nowrap px-6"
                    onClick={() => {
                      handleCreateEvent();
                      setFabOpen(false);
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="shadow-heavy hover:shadow-glow transition-all duration-300 hover-scale glass-light border-2 whitespace-nowrap px-6"
                    onClick={() => {
                      navigate("/join-event");
                      setFabOpen(false);
                    }}
                  >
                    Join Event
                  </Button>
                </div>

                {/* Main FAB Button */}
                <Button
                  size="lg"
                  className={cn(
                    "rounded-full w-16 h-16 shadow-heavy hover:shadow-glow transition-all duration-300 bg-primary hover:bg-primary/80",
                    fabOpen && "rotate-45"
                  )}
                  onClick={() => setFabOpen(!fabOpen)}
                >
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </Button>
              </div>
            </div>
          </div>
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
