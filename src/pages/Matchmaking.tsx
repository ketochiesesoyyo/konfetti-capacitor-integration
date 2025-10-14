import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Heart, Info, Undo, Menu } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FullScreenMatchDialog } from "@/components/FullScreenMatchDialog";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  profileCount?: number;
};

const Matchmaking = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventStatus, setSelectedEventStatus] = useState<string | null>(null);
  const [selectedEventCloseDate, setSelectedEventCloseDate] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
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

      // Fetch all events user is attending
      const { data: attendeeData, error: attendeeError } = await supabase
        .from("event_attendees")
        .select("event_id, events(id, name, date)")
        .eq("user_id", session.user.id)
        .order("events(date)", { ascending: true });

      if (attendeeError) {
        console.error("Error loading events:", attendeeError);
        toast.error("Failed to load events");
        setLoading(false);
        return;
      }

      const userEvents = attendeeData?.map((a: any) => a.events).filter(Boolean) || [];
      setEvents(userEvents);

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

  useEffect(() => {
    if (!selectedEventId || !userId) return;

    const loadProfiles = async () => {
      setLoading(true);
      setCurrentIndex(0);

      // Get event details including status
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by, status, close_date")
        .eq("id", selectedEventId)
        .single();

      const hostId = eventData?.created_by;
      const eventStatus = eventData?.status;
      const closeDate = eventData?.close_date;

      // Store event status
      setSelectedEventStatus(eventStatus || null);
      setSelectedEventCloseDate(closeDate || null);

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
        toast.error("Failed to load profiles");
        setLoading(false);
        return;
      }

      // Filter out the host from attendees
      const attendeeIds = eventAttendees?.map((a) => a.user_id).filter((id) => id !== hostId) || [];

      if (attendeeIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these attendees
      const { data, error } = await supabase.from("profiles").select("*").in("user_id", attendeeIds);

      if (error) {
        toast.error("Failed to load profiles");
        console.error(error);
        setProfiles([]);
      } else {
        // Fetch current user's profile to get their gender preferences
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("gender, interested_in, age, age_min, age_max")
          .eq("user_id", userId)
          .single();

        if (!currentUserProfile || !currentUserProfile.gender || !currentUserProfile.interested_in) {
          toast.error("Please complete your profile with gender preferences");
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

        // Filter profiles based on gender compatibility first
        const genderCompatibleProfiles = (data || []).filter((profile) => {
          // Skip profiles without gender info
          if (!profile.gender || !profile.interested_in) {
            return false;
          }

          // Check if current user is interested in this profile's gender
          const userInterestedInProfile =
            currentUserProfile.interested_in === "both" ||
            (currentUserProfile.interested_in === "men" && profile.gender === "man") ||
            (currentUserProfile.interested_in === "women" && profile.gender === "woman");

          // Check if profile is interested in current user's gender (bidirectional)
          const profileInterestedInUser =
            profile.interested_in === "both" ||
            (profile.interested_in === "men" && currentUserProfile.gender === "man") ||
            (profile.interested_in === "women" && currentUserProfile.gender === "woman");

          // Both must be compatible
          return userInterestedInProfile && profileInterestedInUser;
        });

        // Apply age range filters (bidirectional)
        const ageCompatibleProfiles = genderCompatibleProfiles.filter((profile) => {
          // Skip profiles without age info
          if (!profile.age || !currentUserProfile.age) {
            return false;
          }

          const profileAge = profile.age;
          const currentUserAge = currentUserProfile.age;

          // Get age preferences with defaults
          const userAgeMin = currentUserProfile.age_min || 18;
          const userAgeMax = currentUserProfile.age_max || 99;
          const profileAgeMin = profile.age_min || 18;
          const profileAgeMax = profile.age_max || 99;

          // Check if profile's age is within current user's preference range
          const profileInUserRange = profileAge >= userAgeMin && profileAge <= userAgeMax;

          // Check if current user's age is within profile's preference range
          const userInProfileRange = currentUserAge >= profileAgeMin && currentUserAge <= profileAgeMax;

          // Both must be in each other's range
          return profileInUserRange && userInProfileRange;
        });

        // Filter profiles with second chance logic
        const filteredProfiles = ageCompatibleProfiles.filter((profile) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground">Loading profiles...</p>
        </Card>
      </div>
    );
  }

  const handleSwipe = async (liked: boolean) => {
    if (!userId || !selectedEventId || !currentProfile) return;

    // Trigger exit animation
    setIsExiting(true);

    // Save the swipe and capture the ID
    const { data: swipeData, error: swipeError } = await supabase
      .from("swipes")
      .insert({
        user_id: userId,
        swiped_user_id: currentProfile.user_id,
        event_id: selectedEventId,
        direction: liked ? "right" : "left",
      })
      .select()
      .single();

    if (swipeError) {
      console.error("Error saving swipe:", swipeError);
      toast.error("Failed to save swipe");
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

    if (liked) {
      toast.success("Liked! 💕");

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
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("event_id", selectedEventId)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .or(`user1_id.eq.${currentProfile.user_id},user2_id.eq.${currentProfile.user_id}`)
          .maybeSingle();

        if (!existingMatch) {
          // Create match
          const { data: newMatch, error: matchError } = await supabase
            .from("matches")
            .insert({
              user1_id: userId,
              user2_id: currentProfile.user_id,
              event_id: selectedEventId,
            })
            .select()
            .single();

          if (matchError) {
            console.error("Error creating match:", matchError);
          } else {
            // Show full-screen match dialog
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
      toast("Passed");
    }

    // Wait for animation to complete before moving to next profile
    setTimeout(() => {
      setIsExiting(false);
      if (hasMoreProfiles) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Move to next index to trigger the empty state
        setCurrentIndex((prev) => prev + 1);
        toast("You've seen everyone! Check back later.", {
          description: "New guests may join this event soon.",
        });
      }
    }, 300);
  };

  const handleUndo = async () => {
    if (!lastSwipeId || !lastSwipedProfile || !userId) return;

    // Delete the swipe from database
    const { error: deleteError } = await supabase.from("swipes").delete().eq("id", lastSwipeId);

    if (deleteError) {
      console.error("Error undoing swipe:", deleteError);
      toast.error("Failed to undo");
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

    toast.success("Swipe undone");
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX;
    setSwipeX(diff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const threshold = 100; // pixels to trigger swipe

    if (Math.abs(swipeX) > threshold) {
      // Trigger swipe action
      if (swipeX > 0) {
        handleSwipe(true); // Swiped right = like
      } else {
        handleSwipe(false); // Swiped left = pass
      }
    }

    // Reset swipe position
    setSwipeX(0);
    setSwipeStartX(0);
  };

  // Calculate rotation based on swipe distance
  const getCardTransform = () => {
    const rotation = swipeX / 20; // Subtle rotation effect
    return `translateX(${swipeX}px) rotate(${rotation}deg)`;
  };

  const getSwipeOpacity = () => {
    return Math.min(Math.abs(swipeX) / 100, 1);
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
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center">Select your event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Choose the event you want to find matches for
                    </p>
                    <Select 
                      value={selectedEventId || ""} 
                      onValueChange={(value) => {
                        setSelectedEventId(value);
                        setIsEventDialogOpen(false);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Event to find matches" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...events].sort((a, b) => a.name.localeCompare(b.name)).map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {new Date(event.date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">Select your event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">
                    Choose the event you want to find matches for
                  </p>
                  <Select 
                    value={selectedEventId || ""} 
                    onValueChange={(value) => {
                      setSelectedEventId(value);
                      setIsEventDialogOpen(false);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Event to find matches" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...events].sort((a, b) => a.name.localeCompare(b.name)).map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{event.name}</span>
                            <span className="text-xs">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            className={`overflow-hidden shadow-xl h-full flex flex-col ${
              isExiting
                ? "animate-[scale-out_0.3s_ease-out,fade-out_0.3s_ease-out] opacity-0 scale-95"
                : "animate-slide-up"
            } ${isSwiping ? "" : "transition-transform duration-200"}`}
            style={isSwiping ? { transform: getCardTransform() } : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Entire card content is now scrollable */}
            <div className="overflow-y-auto flex-1">
              {/* Swipe Indicators */}
              {isSwiping && swipeX > 20 && (
                <div className="absolute top-8 left-8 z-10 pointer-events-none" style={{ opacity: getSwipeOpacity() }}>
                  <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[-20deg] shadow-lg border-4 border-white">
                    LIKE
                  </div>
                </div>
              )}
              {isSwiping && swipeX < -20 && (
                <div className="absolute top-8 right-8 z-10 pointer-events-none" style={{ opacity: getSwipeOpacity() }}>
                  <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[20deg] shadow-lg border-4 border-white">
                    PASS
                  </div>
                </div>
              )}

              {/* Photo Section */}
              <div className="relative h-[450px] gradient-sunset overflow-hidden">
                <img
                  src={currentProfile.photos?.[0] || "/placeholder.svg"}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                  <h2 className="text-3xl font-bold mb-1">
                    {currentProfile.name}, {currentProfile.age || "?"}
                  </h2>
                </div>
              </div>

              {/* Info Section - Now part of unified scroll */}
              <div className="p-6 space-y-4">
                {/* Bio */}
                {currentProfile.bio && (
                  <div>
                    <h3 className="font-semibold mb-1">About</h3>
                    <p className="text-foreground">{currentProfile.bio}</p>
                  </div>
                )}

                {/* Prompts */}
                {parsedPrompts.length > 0 &&
                  parsedPrompts.map((prompt: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">{prompt.question}</h3>
                      <p className="text-foreground">{prompt.answer}</p>
                    </div>
                  ))}

                {/* Interests */}
                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">
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
                className="rounded-full w-16 h-16 border-2 hover:border-destructive hover:bg-destructive/10 bg-background shadow-xl"
                onClick={() => handleSwipe(false)}
              >
                <X className="w-8 h-8 text-destructive" />
              </Button>
            </div>
            <div className="pointer-events-auto">
              <Button
                size="lg"
                variant="gradient"
                className="rounded-full w-20 h-20 shadow-2xl"
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
        }}
      />
    </div>
  );
};

export default Matchmaking;
