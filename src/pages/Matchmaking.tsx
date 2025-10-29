import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Heart, Undo, Menu, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FullScreenMatchDialog } from "@/components/FullScreenMatchDialog";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { swipeSchema, matchSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format, isBefore, isAfter } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

type Profile = {
  id: string;
  name: string;
  age: number | null;
  photos: string[] | null;
  prompts: any;
  bio: string | null;
  interests: string[] | null;
  user_id: string;
};

type Event = {
  id: string;
  name: string;
  date: string;
  status?: string;
  close_date?: string;
  matchmaking_start_date?: string;
  matchmaking_start_time?: string;
  matchmaking_close_date?: string;
  profileCount?: number;
};

const Matchmaking = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventStatus, setSelectedEventStatus] = useState<string | null>(null);
  const [selectedEventCloseDate, setSelectedEventCloseDate] = useState<string | null>(null);
  const [matchmakingStartDate, setMatchmakingStartDate] = useState<string | null>(null);
  const [matchmakingStartTime, setMatchmakingStartTime] = useState<string | null>(null);
  const [matchmakingCloseDate, setMatchmakingCloseDate] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<{
    id: string;
    name: string;
    photo_url?: string;
  } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [lastSwipedProfile, setLastSwipedProfile] = useState<Profile | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<"left" | "right" | null>(null);
  const [lastSwipeId, setLastSwipeId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [showAllLive, setShowAllLive] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<string>("");

  useEffect(() => {
    const loadEvents = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch all events user is attending with complete data
      const { data: attendeeData, error: attendeeError } = await supabase
        .from("event_attendees")
        .select("event_id, events(id, name, date, status, close_date, matchmaking_start_date, matchmaking_start_time, matchmaking_close_date)")
        .eq("user_id", session.user.id)
        .order("events(date)", { ascending: true });

      if (attendeeError) {
        console.error("Error loading events:", attendeeError);
        toast.error("Failed to load events");
        setLoading(false);
        return;
      }

      const userEvents = attendeeData?.map((a: any) => a.events).filter(Boolean) || [];
      
      // Fetch profile counts for each event
      const eventsWithCounts = await Promise.all(
        userEvents.map(async (event: Event) => {
          const { count } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          return { ...event, profileCount: count || 0 };
        })
      );
      
      setEvents(eventsWithCounts);

      // Prioritize URL eventId, then saved eventId, then nearest upcoming event
      let defaultEventId = eventId && userEvents.find((e: Event) => e.id === eventId)?.id;

      if (!defaultEventId) {
        const savedEventId = localStorage.getItem("matchmaking_selected_event");
        defaultEventId = savedEventId && userEvents.find((e: Event) => e.id === savedEventId)?.id;
      }

      if (!defaultEventId && userEvents.length > 0) {
        const today = new Date();
        const upcomingEvent = userEvents.find((e: Event) => new Date(e.date) >= today);
        defaultEventId = upcomingEvent?.id || userEvents[0].id;
      }

      if (defaultEventId) {
        setSelectedEventId(defaultEventId);
      } else {
        setLoading(false);
      }
    };

    loadEvents();
  }, [navigate, eventId]);

  // Countdown timer for upcoming events
  useEffect(() => {
    if (matchmakingStartDate && matchmakingStartTime) {
      const interval = setInterval(() => {
        const startDateTime = new Date(`${matchmakingStartDate}T${matchmakingStartTime}`);
        const now = new Date();
        const diff = startDateTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeUntilStart("Starting now!");
          clearInterval(interval);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setTimeUntilStart(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [matchmakingStartDate, matchmakingStartTime]);

  useEffect(() => {
    if (!selectedEventId || !userId) return;

    const loadProfiles = async () => {
      setLoading(true);
      setCurrentIndex(0);

      // Get event details including status and matchmaking schedule
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by, status, close_date, matchmaking_start_date, matchmaking_start_time, matchmaking_close_date")
        .eq("id", selectedEventId)
        .single();

      const hostId = eventData?.created_by;
      const eventStatus = eventData?.status;
      const closeDate = eventData?.close_date;

      // Store event status and matchmaking schedule
      setSelectedEventStatus(eventStatus || null);
      setSelectedEventCloseDate(closeDate || null);
      setMatchmakingStartDate(eventData?.matchmaking_start_date || null);
      setMatchmakingStartTime(eventData?.matchmaking_start_time || null);
      setMatchmakingCloseDate(eventData?.matchmaking_close_date || null);

      // Check if matchmaking has started
      if (eventData?.matchmaking_start_date && eventData?.matchmaking_start_time) {
        const startDateTime = new Date(`${eventData.matchmaking_start_date}T${eventData.matchmaking_start_time}`);
        if (new Date() < startDateTime) {
          setProfiles([]);
          setLoading(false);
          return;
        }
      }

      // Check if matchmaking has closed
      if (eventData?.matchmaking_close_date) {
        const closeDateObj = new Date(eventData.matchmaking_close_date);
        if (new Date() > closeDateObj) {
          setProfiles([]);
          setLoading(false);
          return;
        }
      }

      // If event is closed, show message and don't load profiles
      if (eventStatus === "closed") {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles of users in the selected event only (excluding host)
      const { data: eventAttendees, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("user_id")
        .eq("event_id", selectedEventId)
        .neq("user_id", userId);

      if (attendeesError) {
        console.error("Error loading attendees:", attendeesError);
        toast.error(t('matchmaking.failedLoadProfiles'));
        setLoading(false);
        return;
      }

      // Filter out the host from attendees - Don't filter! If host joined via invite, they should be matchable
      const attendeeIds = eventAttendees?.map((a) => a.user_id) || [];

      if (attendeeIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these attendees
      const { data, error } = await supabase.from("profiles").select("*").in("user_id", attendeeIds);

      if (error) {
        toast.error(t('matchmaking.failedLoadProfiles'));
        console.error(error);
        setProfiles([]);
      } else {
        // Fetch current user's profile to get their gender preferences
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("gender, interested_in, age, age_min, age_max")
          .eq("user_id", userId)
          .single();

        // Only require current user to have preferences set
        // Don't block if other users haven't completed their profiles yet
        if (!currentUserProfile || !currentUserProfile.gender || !currentUserProfile.interested_in) {
          toast.error(t('matchmaking.completeProfile'));
          navigate("/edit-profile");
          setLoading(false);
          return;
        }

        // Filter profiles based on swipe history with second chance logic
        const { data: existingSwipes } = await supabase
          .from("swipes")
          .select("swiped_user_id, direction, created_at")
          .eq("user_id", userId)
          .eq("event_id", selectedEventId)
          .order("created_at", { ascending: false });

        // Group swipes by user
        const swipesByUser = new Map<string, Array<{ direction: string; created_at: string }>>();
        existingSwipes?.forEach((swipe) => {
          if (!swipesByUser.has(swipe.swiped_user_id)) {
            swipesByUser.set(swipe.swiped_user_id, []);
          }
          swipesByUser.get(swipe.swiped_user_id)!.push({
            direction: swipe.direction,
            created_at: swipe.created_at,
          });
        });

        // Filter profiles based on gender compatibility (only current user's preference matters)
        const genderCompatibleProfiles = (data || []).filter((profile) => {
          // If profile hasn't set gender, still show them
          if (!profile.gender) {
            return true; // Show incomplete profiles
          }

          // Check if current user is interested in this profile's gender
          // Only the current user's preference matters (unidirectional)
          const userInterestedInProfile =
            currentUserProfile.interested_in === "both" ||
            (currentUserProfile.interested_in === "men" && profile.gender === "man") ||
            (currentUserProfile.interested_in === "women" && profile.gender === "woman");

          return userInterestedInProfile;
        });

        // Apply age range filters (only check current user's preferences)
        const ageCompatibleProfiles = genderCompatibleProfiles.filter((profile) => {
          // If either user doesn't have age, show the profile (don't exclude)
          if (!profile.age || !currentUserProfile.age) {
            return true;
          }

          const profileAge = profile.age;

          // Get current user's age preferences with defaults
          const userAgeMin = currentUserProfile.age_min || 18;
          const userAgeMax = currentUserProfile.age_max || 99;

          // Check if profile's age is within current user's preference range
          // We only check one direction - if the current user wants to see them
          return profileAge >= userAgeMin && profileAge <= userAgeMax;
        });

        // Fetch unmatches to exclude users who have been unmatched
        const { data: unmatchedUsers } = await supabase
          .from("unmatches")
          .select("unmatched_user_id")
          .eq("unmatcher_id", userId)
          .eq("event_id", selectedEventId);

        const unmatchedUserIds = new Set(unmatchedUsers?.map(u => u.unmatched_user_id) || []);

        // Filter out unmatched users
        const nonUnmatchedProfiles = ageCompatibleProfiles.filter((profile) => {
          return !unmatchedUserIds.has(profile.user_id);
        });

        // Filter profiles with second chance logic
        const filteredProfiles = nonUnmatchedProfiles.filter((profile) => {
          const userSwipes = swipesByUser.get(profile.user_id);

          // Never swiped = show
          if (!userSwipes || userSwipes.length === 0) {
            return true;
          }

          // Hit 3 swipes limit = don't show
          if (userSwipes.length >= 3) {
            return false;
          }

          const mostRecentSwipe = userSwipes[0];

          // Already liked = don't show again
          if (mostRecentSwipe.direction === "right") {
            return false;
          }

          // Recently passed (< 24h) = don't show yet
          const hoursSinceSwipe = (Date.now() - new Date(mostRecentSwipe.created_at).getTime()) / (1000 * 60 * 60);
          if (hoursSinceSwipe < 24) {
            return false;
          }

          // Passed but 24h+ elapsed = show for second chance
          return true;
        });

        setProfiles(filteredProfiles);
      }
      setLoading(false);

      // Save selection
      localStorage.setItem("matchmaking_selected_event", selectedEventId);
    };

    loadProfiles();
  }, [selectedEventId, userId, navigate]);

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length - 1;

  // Parse prompts safely
  const parsedPrompts = currentProfile?.prompts
    ? Array.isArray(currentProfile.prompts)
      ? currentProfile.prompts
      : []
    : [];

  // Helper functions for event categorization
  const categorizeEvents = () => {
    const now = new Date();
    const live: Event[] = [];
    const upcoming: Event[] = [];
    const past: Event[] = [];

    events.forEach((event) => {
      // Past: matchmaking closed or event closed
      if (
        event.status === "closed" ||
        (event.matchmaking_close_date && isAfter(now, new Date(event.matchmaking_close_date)))
      ) {
        past.push(event);
      }
      // Upcoming: matchmaking hasn't started yet
      else if (
        event.matchmaking_start_date &&
        event.matchmaking_start_time &&
        isBefore(now, new Date(`${event.matchmaking_start_date}T${event.matchmaking_start_time}`))
      ) {
        upcoming.push(event);
      }
      // Live: matchmaking is currently active
      else {
        live.push(event);
      }
    });

    return { live, upcoming, past };
  };

  const { live: liveEvents, upcoming: upcomingEvents, past: pastEvents } = categorizeEvents();

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate) return "Date TBD";
    const start = format(new Date(startDate), "MMM d");
    const end = endDate ? format(new Date(endDate), "MMM d, yyyy") : "";
    return end ? `${start} - ${end}` : start;
  };

  const formatDateTime = (date: Date) => {
    return format(date, "MMMM d, yyyy • h:mm a");
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsEventDialogOpen(false);
    setShowAllLive(false);
    setShowAllUpcoming(false);
    setShowAllPast(false);
  };

  const EventCard = ({ event, status }: { event: Event; status: "live" | "upcoming" | "past" }) => {
    const isSelected = event.id === selectedEventId;
    
    return (
      <button
        onClick={() => handleEventSelect(event.id)}
        className={cn(
          "w-full p-4 rounded-xl border-2 transition-all text-left space-y-2 hover:scale-[1.02]",
          isSelected 
            ? "border-primary bg-primary/10" 
            : "border-border bg-card hover:bg-accent"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-base">{event.name}</div>
          {status === "live" && (
            <Badge variant="default" className="shrink-0 bg-green-500 hover:bg-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
              Live
            </Badge>
          )}
          {status === "upcoming" && (
            <Badge variant="secondary" className="shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              Soon
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDateRange(event.matchmaking_start_date || event.date, event.close_date)}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground">{t('matchmaking.loadingProfiles')}</p>
        </Card>
      </div>
    );
  }

  const handleSwipe = async (liked: boolean) => {
    if (!userId || !selectedEventId || !currentProfile) return;

    // Validate swipe data
    const swipeValidation = swipeSchema.safeParse({
      direction: liked ? "right" : "left",
      swiped_user_id: currentProfile.user_id,
      event_id: selectedEventId,
    });

    if (!swipeValidation.success) {
      toast.error(t('matchmaking.invalidSwipe'));
      return;
    }

    // Trigger exit animation
    setIsExiting(true);

    const validated = swipeValidation.data;

    // Save the swipe and capture the ID
    const { data: swipeData, error: swipeError } = await supabase
      .from("swipes")
      .insert({
        user_id: userId,
        swiped_user_id: validated.swiped_user_id,
        event_id: validated.event_id,
        direction: validated.direction,
      })
      .select()
      .single();

    if (swipeError) {
      console.error("Error saving swipe:", swipeError);
      toast.error(t('matchmaking.failedSaveSwipe'));
      setIsExiting(false);
      return;
    }

    // Store last swipe info for undo
    setLastSwipedProfile(currentProfile);
    setLastSwipeDirection(liked ? "right" : "left");
    setLastSwipeId(swipeData.id);
    setShowUndo(true);

    // Hide undo button after 5 seconds
    setTimeout(() => {
      setShowUndo(false);
      setLastSwipedProfile(null);
      setLastSwipeDirection(null);
      setLastSwipeId(null);
    }, 5000);

    let matchCreated = false;

    if (liked) {
      toast.success(t('matchmaking.liked'));

      // Check if the other user already liked us
      const { data: reciprocalSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("user_id", currentProfile.user_id)
        .eq("swiped_user_id", userId)
        .eq("event_id", selectedEventId)
        .eq("direction", "right")
        .maybeSingle();

      if (reciprocalSwipe) {
        // Check if match already exists (check both user combinations)
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("event_id", selectedEventId)
          .or(`and(user1_id.eq.${userId},user2_id.eq.${currentProfile.user_id}),and(user1_id.eq.${currentProfile.user_id},user2_id.eq.${userId})`)
          .maybeSingle();

        if (!existingMatch) {
          // Validate match data
          const matchValidation = matchSchema.safeParse({
            user1_id: userId,
            user2_id: currentProfile.user_id,
            event_id: selectedEventId,
          });

          if (!matchValidation.success) {
            console.error("Invalid match data");
            return;
          }

          const validatedMatch = matchValidation.data;

          // Ensure user1_id < user2_id to satisfy check constraint
          const sortedUserIds = [validatedMatch.user1_id, validatedMatch.user2_id].sort();

          // Create match
          const { data: newMatch, error: matchError } = await supabase
            .from("matches")
            .insert({
              user1_id: sortedUserIds[0],
              user2_id: sortedUserIds[1],
              event_id: validatedMatch.event_id,
            })
            .select()
            .single();

          if (matchError) {
            console.error("Error creating match:", matchError);
          } else {
            // Show full-screen match dialog
            matchCreated = true;
            setMatchId(newMatch.id);
            setMatchedProfile({
              id: currentProfile.user_id,
              name: currentProfile.name,
              photo_url: currentProfile.photos?.[0] || undefined,
            });
            setShowMatchDialog(true);
          }
        }
      }
    } else {
      toast(t('matchmaking.passed'));
    }

    // Only move to next profile if NO match was created
    // If match was created, user must click a button in the dialog to continue
    if (!matchCreated) {
      // Wait for animation to complete before moving to next profile
      setTimeout(() => {
        setIsExiting(false);
        if (hasMoreProfiles) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Move to next index to trigger the empty state
          setCurrentIndex((prev) => prev + 1);
          toast(t('matchmaking.seenEveryone'), {
            description: t('matchmaking.checkBackLater'),
          });
        }
      }, 300);
    } else {
      // Match was created, just reset exit animation
      setIsExiting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastSwipeId || !lastSwipedProfile || !userId) return;

    // Delete the swipe from database
    const { error: deleteError } = await supabase.from("swipes").delete().eq("id", lastSwipeId);

    if (deleteError) {
      console.error("Error undoing swipe:", deleteError);
      toast.error(t('matchmaking.failedUndo'));
      return;
    }

    // If it was a like that created a match, delete the match
    if (lastSwipeDirection === "right") {
      await supabase
        .from("matches")
        .delete()
        .eq("event_id", selectedEventId)
        .eq("user1_id", userId)
        .eq("user2_id", lastSwipedProfile.user_id);
    }

    // Move back one profile
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      // Reinsert the profile back into the array
      setProfiles((prev) => {
        const newProfiles = [...prev];
        newProfiles.splice(currentIndex - 1, 0, lastSwipedProfile);
        return newProfiles;
      });
    }

    // Clear undo state
    setShowUndo(false);
    setLastSwipedProfile(null);
    setLastSwipeDirection(null);
    setLastSwipeId(null);

    toast.success(t('matchmaking.swipeUndone'));
  };


  if (!currentProfile || profiles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with Event Selector */}
        <div className="bg-background p-4 border-b">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-center relative mb-3">
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute left-0">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Browse Your Events</DialogTitle>
                  </DialogHeader>
                  
                  <ScrollArea className="flex-1 pr-4">
                    <Accordion type="multiple" defaultValue={["live"]} className="space-y-4">
                      {/* Live Events Section */}
                      {liveEvents.length > 0 && (
                        <AccordionItem value="live" className="border rounded-xl px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                                Live
                              </Badge>
                              <span className="font-semibold">Live Events</span>
                              <span className="text-sm text-muted-foreground">({liveEvents.length})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {(showAllLive ? liveEvents : liveEvents.slice(0, 5)).map((event) => (
                                <EventCard key={event.id} event={event} status="live" />
                              ))}
                              {liveEvents.length > 5 && !showAllLive && (
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-sm"
                                  onClick={() => setShowAllLive(true)}
                                >
                                  View All {liveEvents.length} Events
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Upcoming Events Section */}
                      {upcomingEvents.length > 0 && (
                        <AccordionItem value="upcoming" className="border rounded-xl px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Upcoming
                              </Badge>
                              <span className="font-semibold">Upcoming Events</span>
                              <span className="text-sm text-muted-foreground">({upcomingEvents.length})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {(showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 5)).map((event) => (
                                <EventCard key={event.id} event={event} status="upcoming" />
                              ))}
                              {upcomingEvents.length > 5 && !showAllUpcoming && (
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-sm"
                                  onClick={() => setShowAllUpcoming(true)}
                                >
                                  View All {upcomingEvents.length} Events
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Past Events Section */}
                      {pastEvents.length > 0 && (
                        <AccordionItem value="past" className="border rounded-xl px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Past</Badge>
                              <span className="font-semibold">Past Events</span>
                              <span className="text-sm text-muted-foreground">({pastEvents.length})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {(showAllPast ? pastEvents : pastEvents.slice(0, 5)).map((event) => (
                                <EventCard key={event.id} event={event} status="past" />
                              ))}
                              {pastEvents.length > 5 && !showAllPast && (
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-sm"
                                  onClick={() => setShowAllPast(true)}
                                >
                                  View All {pastEvents.length} Events
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <KonfettiLogo className="w-32 h-auto" />
            </div>
            {selectedEventId && (
              <p className="text-lg font-bold text-foreground text-center">
                {events.find(e => e.id === selectedEventId)?.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md">
            {!selectedEventId || events.length === 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Enter event code</h2>
                <p className="text-muted-foreground mb-4">Join an event to start matching with other guests.</p>
                <Button onClick={() => navigate("/join-event")}>Join Event</Button>
              </>
            ) : matchmakingStartDate && matchmakingStartTime && new Date() < new Date(`${matchmakingStartDate}T${matchmakingStartTime}`) ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Matchmaking Opens Soon</h2>
                <div className="text-4xl font-bold text-primary mb-4 font-mono">
                  {timeUntilStart}
                </div>
                <p className="text-muted-foreground mb-4">
                  Matchmaking opens on{" "}
                  {formatDateTime(new Date(`${matchmakingStartDate}T${matchmakingStartTime}`))}
                </p>
                <Button onClick={() => navigate("/")}>Go Home</Button>
              </>
            ) : matchmakingCloseDate && new Date() > new Date(matchmakingCloseDate) ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Matchmaking Has Closed</h2>
                <p className="text-muted-foreground mb-4">
                  Matchmaking ended on {new Date(matchmakingCloseDate).toLocaleDateString()}. Your chats remain active!
                </p>
                <Button onClick={() => navigate("/chats")}>View Chats</Button>
              </>
            ) : selectedEventStatus === "closed" ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Event Closed</h2>
                <p className="text-muted-foreground mb-4">
                  This event is now closed and no new matches will appear here. However, your chats remain active until{" "}
                  {selectedEventCloseDate
                    ? new Date(selectedEventCloseDate).toLocaleDateString()
                    : "3 days after the event was closed"}
                  .
                </p>
                <Button onClick={() => navigate("/chats")}>View Chats</Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
                <p className="text-muted-foreground mb-4">
                  You've seen everyone at this event. Check back later when more guests join!
                </p>
                <Button onClick={() => navigate("/")}>Go Home</Button>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Event Selector */}
      <div className="bg-background p-4 border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center relative mb-3">
            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute left-0">
                  <Menu className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Browse Your Events</DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="flex-1 pr-4">
                  <Accordion type="multiple" defaultValue={["live"]} className="space-y-4">
                    {/* Live Events Section */}
                    {liveEvents.length > 0 && (
                      <AccordionItem value="live" className="border rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                              Live
                            </Badge>
                            <span className="font-semibold">Live Events</span>
                            <span className="text-sm text-muted-foreground">({liveEvents.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {(showAllLive ? liveEvents : liveEvents.slice(0, 5)).map((event) => (
                              <EventCard key={event.id} event={event} status="live" />
                            ))}
                            {liveEvents.length > 5 && !showAllLive && (
                              <Button 
                                variant="ghost" 
                                className="w-full text-sm"
                                onClick={() => setShowAllLive(true)}
                              >
                                View All {liveEvents.length} Events
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {/* Upcoming Events Section */}
                    {upcomingEvents.length > 0 && (
                      <AccordionItem value="upcoming" className="border rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Upcoming
                            </Badge>
                            <span className="font-semibold">Upcoming Events</span>
                            <span className="text-sm text-muted-foreground">({upcomingEvents.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {(showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 5)).map((event) => (
                              <EventCard key={event.id} event={event} status="upcoming" />
                            ))}
                            {upcomingEvents.length > 5 && !showAllUpcoming && (
                              <Button 
                                variant="ghost" 
                                className="w-full text-sm"
                                onClick={() => setShowAllUpcoming(true)}
                              >
                                View All {upcomingEvents.length} Events
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {/* Past Events Section */}
                    {pastEvents.length > 0 && (
                      <AccordionItem value="past" className="border rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Past</Badge>
                            <span className="font-semibold">Past Events</span>
                            <span className="text-sm text-muted-foreground">({pastEvents.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {(showAllPast ? pastEvents : pastEvents.slice(0, 5)).map((event) => (
                              <EventCard key={event.id} event={event} status="past" />
                            ))}
                            {pastEvents.length > 5 && !showAllPast && (
                              <Button 
                                variant="ghost" 
                                className="w-full text-sm"
                                onClick={() => setShowAllPast(true)}
                              >
                                View All {pastEvents.length} Events
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <KonfettiLogo className="w-32 h-auto" />
          </div>
          {selectedEventId && (
            <p className="text-lg font-bold text-foreground text-center mb-2">
              {events.find(e => e.id === selectedEventId)?.name}
            </p>
          )}
          {/* Profile count badge */}
          <div className="text-center">
            <Badge variant="secondary">
              {profiles.length - currentIndex} profile{profiles.length - currentIndex !== 1 ? "s" : ""} left
            </Badge>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg relative h-[calc(100vh-200px)]">
          <Card
            className={cn(
              "overflow-hidden shadow-card hover-lift h-full flex flex-col rounded-[36px]",
              isExiting
                ? "animate-[scale-out_0.3s_ease-out,fade-out_0.3s_ease-out] opacity-0 scale-95"
                : "animate-enter"
            )}
          >
            {/* Entire card content is now scrollable */}
            <div className="overflow-y-auto flex-1">
              {/* Photo Section */}
              <div className="relative h-[450px] gradient-sunset overflow-hidden">
                <img
                  src={currentProfile.photos?.[0] || "/placeholder.svg"}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 glass-medium p-8 text-white border-t border-white/20">
                  <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">
                    {currentProfile.name}, {currentProfile.age || "?"}
                  </h2>
                </div>
              </div>

              {/* Info Section - Now part of unified scroll */}
              <div className="p-8 space-y-6">
                {/* Bio */}
                {currentProfile.bio && (
                  <div className="p-5 rounded-3xl bg-secondary/30 border border-border/50">
                    <h3 className="font-semibold mb-2 text-primary">About</h3>
                    <p className="text-foreground leading-relaxed">{currentProfile.bio}</p>
                  </div>
                )}

                {/* Prompts */}
                {parsedPrompts.length > 0 &&
                  parsedPrompts.map((prompt: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-3xl bg-secondary/30 border border-border/50">
                      <h3 className="font-semibold text-sm text-primary mb-2">{prompt.question}</h3>
                      <p className="text-foreground leading-relaxed">{prompt.answer}</p>
                    </div>
                  ))}

                {/* Interests */}
                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div className="p-5 rounded-3xl bg-secondary/30 border border-border/50">
                    <h3 className="font-semibold mb-3 text-primary">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="rounded-full px-4 py-1.5">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Undo Button - Appears temporarily after swipe */}
          {showUndo && lastSwipedProfile && (
            <div className="fixed top-20 left-0 right-0 flex items-center justify-center z-50 pointer-events-none px-4 animate-fade-in">
              <div className="pointer-events-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full px-4 py-2 shadow-lg bg-background/95 backdrop-blur border-2 border-primary animate-pulse"
                  onClick={handleUndo}
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo {lastSwipeDirection === "right" ? "Like" : "Pass"}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons - Fixed position above nav bar */}
          <div className="fixed bottom-24 left-0 right-0 flex items-center justify-center gap-6 z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 border-2 hover:border-destructive hover:bg-destructive/10 bg-card shadow-card hover:shadow-card-hover transition-all"
                onClick={() => handleSwipe(false)}
              >
                <X className="w-8 h-8 text-destructive" />
              </Button>
            </div>
            <div className="pointer-events-auto">
              <Button
                size="lg"
                variant="gradient"
                className="rounded-full w-20 h-20 shadow-card-hover hover:scale-110 transition-all"
                onClick={() => handleSwipe(true)}
              >
                <Heart className="w-10 h-10" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Match Dialog */}
      <FullScreenMatchDialog
        open={showMatchDialog}
        matchedProfile={matchedProfile}
        onStartChat={() => {
          setShowMatchDialog(false);
          if (matchId) {
            navigate(`/chat/${matchId}`);
          }
        }}
        onKeepMatching={() => {
          setShowMatchDialog(false);
          setMatchedProfile(null);
          setMatchId(null);
          // Now advance to next profile
          if (currentIndex < profiles.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setCurrentIndex((prev) => prev + 1);
            toast("You've seen everyone! Check back later.", {
              description: "New guests may join this event soon.",
            });
          }
        }}
      />
    </div>
  );
};

export default Matchmaking;
