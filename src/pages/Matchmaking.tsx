import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { X, Heart, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  profileCount?: number;
};

const Matchmaking = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

      // Select the nearest upcoming event or first event
      const savedEventId = localStorage.getItem("matchmaking_selected_event");
      let defaultEventId = savedEventId && userEvents.find((e: Event) => e.id === savedEventId)?.id;
      
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
  }, [navigate]);

  useEffect(() => {
    if (!selectedEventId || !userId) return;

    const loadProfiles = async () => {
      setLoading(true);
      setCurrentIndex(0);

      // Get event host to exclude them
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by")
        .eq("id", selectedEventId)
        .single();

      const hostId = eventData?.created_by;

      // Fetch profiles of users in the selected event only (excluding host)
      const { data: eventAttendees, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("user_id")
        .eq("event_id", selectedEventId)
        .neq("user_id", userId)

      if (attendeesError) {
        console.error("Error loading attendees:", attendeesError);
        toast.error("Failed to load profiles");
        setLoading(false);
        return;
      }

      // Filter out the host from attendees
      const attendeeIds = eventAttendees
        ?.map(a => a.user_id)
        .filter(id => id !== hostId) || [];

      if (attendeeIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these attendees
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", attendeeIds);

      if (error) {
        toast.error("Failed to load profiles");
        console.error(error);
        setProfiles([]);
      } else {
        // Fetch current user's profile to get their gender preferences
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("gender, interested_in")
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
        existingSwipes?.forEach(swipe => {
          if (!swipesByUser.has(swipe.swiped_user_id)) {
            swipesByUser.set(swipe.swiped_user_id, []);
          }
          swipesByUser.get(swipe.swiped_user_id)!.push({
            direction: swipe.direction,
            created_at: swipe.created_at
          });
        });

        // Filter profiles based on gender compatibility first
        const genderCompatibleProfiles = (data || []).filter(profile => {
          // Skip profiles without gender info
          if (!profile.gender || !profile.interested_in) {
            return false;
          }
          
          // Check if current user is interested in this profile's gender
          const userInterestedInProfile = 
            currentUserProfile.interested_in === 'both' ||
            (currentUserProfile.interested_in === 'men' && profile.gender === 'man') ||
            (currentUserProfile.interested_in === 'women' && profile.gender === 'woman');
          
          // Check if profile is interested in current user's gender (bidirectional)
          const profileInterestedInUser =
            profile.interested_in === 'both' ||
            (profile.interested_in === 'men' && currentUserProfile.gender === 'man') ||
            (profile.interested_in === 'women' && currentUserProfile.gender === 'woman');
          
          // Both must be compatible
          return userInterestedInProfile && profileInterestedInUser;
        });

        // Filter profiles with second chance logic
        const filteredProfiles = genderCompatibleProfiles.filter(profile => {
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
          if (mostRecentSwipe.direction === 'right') {
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
    ? (Array.isArray(currentProfile.prompts) ? currentProfile.prompts : [])
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

    // Save the swipe
    const { error: swipeError } = await supabase
      .from("swipes")
      .insert({
        user_id: userId,
        swiped_user_id: currentProfile.user_id,
        event_id: selectedEventId,
        direction: liked ? "right" : "left",
      });

    if (swipeError) {
      console.error("Error saving swipe:", swipeError);
      toast.error("Failed to save swipe");
      setIsExiting(false);
      return;
    }

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
            setTimeout(() => {
              toast("It's a Match! 🎉", {
                description: `You and ${currentProfile.name} liked each other!`,
                action: {
                  label: "Send Message",
                  onClick: () => navigate(`/chat/${newMatch.id}`),
                },
              });
            }, 500);
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

  if (!currentProfile || profiles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with Event Selector */}
        <div className="gradient-sunset text-white p-4">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-3">Matchmaking</h1>
            <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
            <p className="text-muted-foreground mb-4">
              You've seen everyone at this event. Check back later when more guests join!
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </Card>
        </div>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Event Selector */}
      <div className="gradient-sunset text-white p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-3">Matchmaking</h1>
          
          {/* Event Selector Dropdown */}
          <div className="mb-2">
            <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profile count badge */}
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {profiles.length - currentIndex} profile{profiles.length - currentIndex !== 1 ? 's' : ''} left
          </Badge>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className={`overflow-hidden shadow-xl transition-all duration-300 ${
            isExiting 
              ? 'animate-[scale-out_0.3s_ease-out,fade-out_0.3s_ease-out] opacity-0 scale-95' 
              : 'animate-slide-up'
          }`}>
            {/* Photo Section - Fixed with card */}
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

            {/* Info Section - Scrollable */}
            <div className="p-6 max-h-[250px] overflow-y-auto space-y-4">
              {/* Bio */}
              {currentProfile.bio && (
                <div>
                  <h3 className="font-semibold mb-1">About</h3>
                  <p className="text-foreground">{currentProfile.bio}</p>
                </div>
              )}

              {/* Prompts */}
              {parsedPrompts.length > 0 && parsedPrompts.map((prompt: any, idx: number) => (
                <div key={idx}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {prompt.question}
                  </h3>
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
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-2 hover:border-destructive hover:bg-destructive/10"
              onClick={() => handleSwipe(false)}
            >
              <X className="w-8 h-8 text-destructive" />
            </Button>
            <Button
              size="lg"
              variant="gradient"
              className="rounded-full w-20 h-20 shadow-xl"
              onClick={() => handleSwipe(true)}
            >
              <Heart className="w-10 h-10" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;
