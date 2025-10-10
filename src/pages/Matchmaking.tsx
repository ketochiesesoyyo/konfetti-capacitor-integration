import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const Matchmaking = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Get the user's event
      const { data: attendeeData } = await supabase
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (attendeeData) {
        setEventId(attendeeData.event_id);
      }

      // Fetch profiles of users in same events
      // The RLS policy will automatically filter to only show same-event users
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", session.user.id); // Don't show own profile

      if (error) {
        toast.error("Failed to load profiles");
        console.error(error);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    loadProfiles();
  }, [navigate]);

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
    if (!userId || !eventId || !currentProfile) return;

    // Save the swipe
    const { error: swipeError } = await supabase
      .from("swipes")
      .insert({
        user_id: userId,
        swiped_user_id: currentProfile.user_id,
        event_id: eventId,
        direction: liked ? "right" : "left",
      });

    if (swipeError) {
      console.error("Error saving swipe:", swipeError);
      toast.error("Failed to save swipe");
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
        .eq("event_id", eventId)
        .eq("direction", "right")
        .maybeSingle();

      if (reciprocalSwipe) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("event_id", eventId)
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
              event_id: eventId,
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

    if (hasMoreProfiles) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast("You've seen everyone! Check back later.", {
        description: "New guests may join the wedding soon.",
      });
    }
  };

  if (!currentProfile || profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">No profiles available</h2>
          <p className="text-muted-foreground mb-4">
            There are no other guests from your events yet. Check back later when more guests join!
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-sunset text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Matchmaking</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {profiles.length - currentIndex} left
          </Badge>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="overflow-hidden shadow-xl animate-slide-up">
            {/* Photo Section */}
            <div className="relative h-[450px] gradient-sunset">
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
