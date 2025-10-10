import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ProfileWithEvent = {
  id: string;
  name: string;
  age: number | null;
  photo: string;
  bio: string | null;
  interests: string[] | null;
  eventName: string;
  eventId: string;
  swipeId: string;
};

const LikedYou = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"new" | "passed">("new");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newLikes, setNewLikes] = useState<ProfileWithEvent[]>([]);
  const [passedLikes, setPassedLikes] = useState<ProfileWithEvent[]>([]);

  useEffect(() => {
    const loadLikes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch people who liked current user
      const { data: incomingSwipes, error } = await supabase
        .from("swipes")
        .select(`
          id,
          user_id,
          event_id,
          direction,
          profiles!swipes_user_id_fkey(id, name, age, photos, bio, interests),
          events(id, name)
        `)
        .eq("swiped_user_id", session.user.id)
        .eq("direction", "right");

      if (error) {
        console.error("Error loading likes:", error);
        toast.error("Failed to load likes");
        setLoading(false);
        return;
      }

      // Check if current user has responded to these swipes
      const { data: userSwipes } = await supabase
        .from("swipes")
        .select("swiped_user_id, direction")
        .eq("user_id", session.user.id);

      const userSwipeMap = new Map(
        userSwipes?.map(s => [s.swiped_user_id, s.direction]) || []
      );

      const formattedLikes = incomingSwipes?.map((swipe: any) => ({
        id: swipe.profiles.id,
        name: swipe.profiles.name,
        age: swipe.profiles.age,
        photo: swipe.profiles.photos?.[0] || "/placeholder.svg",
        bio: swipe.profiles.bio,
        interests: swipe.profiles.interests,
        eventName: swipe.events.name,
        eventId: swipe.event_id,
        swipeId: swipe.id,
        userResponse: userSwipeMap.get(swipe.user_id),
      })) || [];

      // Separate into new likes (no response) and passed
      setNewLikes(formattedLikes.filter((like: any) => !like.userResponse));
      setPassedLikes(formattedLikes.filter((like: any) => like.userResponse === "left"));
      setLoading(false);
    };

    loadLikes();
  }, [navigate]);

  const handleLike = async (profile: ProfileWithEvent) => {
    if (!userId) return;

    try {
      // Create a swipe record
      const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
          user_id: userId,
          swiped_user_id: profile.id,
          event_id: profile.eventId,
          direction: "right",
        });

      if (swipeError) throw swipeError;

      // Check if there's a match
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("event_id", profile.eventId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .maybeSingle();

      if (!match) {
        // Create match
        await supabase.from("matches").insert({
          user1_id: userId,
          user2_id: profile.id,
          event_id: profile.eventId,
        });
      }

      toast("It's a Match! 🎉", {
        description: `You and ${profile.name} liked each other!`,
      });

      // Remove from new likes
      setNewLikes(prev => prev.filter(p => p.id !== profile.id));
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
    }
  };

  const handlePass = async (profile: ProfileWithEvent) => {
    if (!userId) return;

    try {
      await supabase.from("swipes").insert({
        user_id: userId,
        swiped_user_id: profile.id,
        event_id: profile.eventId,
        direction: "left",
      });

      toast(`Passed on ${profile.name}`);
      setNewLikes(prev => prev.filter(p => p.id !== profile.id));
      setPassedLikes(prev => [...prev, profile]);
    } catch (error) {
      console.error("Error passing:", error);
      toast.error("Failed to pass");
    }
  };

  const ProfileCard = ({ profile, isPassed = false }: { profile: ProfileWithEvent; isPassed?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">
                {profile.name}, {profile.age || "?"}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{profile.eventName}</span>
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile.bio}</p>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {profile.interests.slice(0, 3).map((interest: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {isPassed ? (
              <Button
                size="sm"
                variant="gradient"
                className="flex-1"
                onClick={() => handleLike(profile)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePass(profile)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Pass
                </Button>
                <Button
                  size="sm"
                  variant="gradient"
                  className="flex-1"
                  onClick={() => handleLike(profile)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Like
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1">Liked You</h1>
          <p className="text-white/90 text-sm">People who are interested in you</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("new")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "new"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              New Likes ({newLikes.length})
            </button>
            <button
              onClick={() => setActiveTab("passed")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "passed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Passed ({passedLikes.length})
            </button>
          </div>
        </Card>

        {/* Likes List */}
        <div className="space-y-4 pb-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading likes...</p>
            </Card>
          ) : activeTab === "new" ? (
            newLikes.length > 0 ? (
              newLikes.map((profile) => (
                <ProfileCard key={profile.swipeId} profile={profile} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No new likes yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Keep swiping to find your matches!
                </p>
              </Card>
            )
          ) : passedLikes.length > 0 ? (
            passedLikes.map((profile) => (
              <ProfileCard key={profile.swipeId} profile={profile} isPassed />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No passed profiles</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedYou;
