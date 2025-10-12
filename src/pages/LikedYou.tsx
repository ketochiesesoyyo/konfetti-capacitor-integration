import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";

type ProfileWithEvent = {
  id: string;
  user_id: string;
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
  const [activeTab, setActiveTab] = useState<"new" | "passed" | "all-likes">("new");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newLikes, setNewLikes] = useState<ProfileWithEvent[]>([]);
  const [passedLikes, setPassedLikes] = useState<ProfileWithEvent[]>([]);
  const [allLikes, setAllLikes] = useState<ProfileWithEvent[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithEvent | null>(null);

  useEffect(() => {
    const loadLikes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch people who liked current user (get swipe data and event info first)
      const { data: incomingSwipes, error } = await supabase
        .from("swipes")
        .select(`
          id,
          user_id,
          event_id,
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

      if (!incomingSwipes || incomingSwipes.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique user IDs who liked current user
      const likerUserIds = [...new Set(incomingSwipes.map((s: any) => s.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, name, age, photos, bio, interests, gender, interested_in")
        .in("user_id", likerUserIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        toast.error("Failed to load profiles");
        setLoading(false);
        return;
      }

      // Create a map for quick profile lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch current user's profile for gender preferences
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("gender, interested_in")
        .eq("user_id", session.user.id)
        .single();

      if (!currentUserProfile || !currentUserProfile.gender || !currentUserProfile.interested_in) {
        // User needs to complete profile
        setNewLikes([]);
        setPassedLikes([]);
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

      // Combine swipe data with profile data
      const formattedLikes = incomingSwipes
        ?.map((swipe: any) => {
          const profile = profileMap.get(swipe.user_id);
          if (!profile) return null; // Skip if profile not found
          
          return {
            id: profile.id,
            user_id: profile.user_id,
            name: profile.name,
            age: profile.age,
            photo: profile.photos?.[0] || "/placeholder.svg",
            bio: profile.bio,
            interests: profile.interests,
            eventName: swipe.events.name,
            eventId: swipe.event_id,
            swipeId: swipe.id,
            userResponse: userSwipeMap.get(swipe.user_id),
            gender: profile.gender,
            interested_in: profile.interested_in,
          };
        })
        .filter(Boolean) || [];

      // Filter for gender compatibility
      const genderCompatibleLikes = formattedLikes.filter((like: any) => {
        const profile = like;
        
        if (!profile.gender || !profile.interested_in) {
          return false;
        }
        
        // Same bidirectional check as matchmaking
        const userInterestedInProfile = 
          currentUserProfile.interested_in === 'both' ||
          (currentUserProfile.interested_in === 'men' && profile.gender === 'man') ||
          (currentUserProfile.interested_in === 'women' && profile.gender === 'woman');
        
        const profileInterestedInUser =
          profile.interested_in === 'both' ||
          (profile.interested_in === 'men' && currentUserProfile.gender === 'man') ||
          (profile.interested_in === 'women' && currentUserProfile.gender === 'woman');
        
        return userInterestedInProfile && profileInterestedInUser;
      });

      // Separate into new likes (no response) and passed
      setNewLikes(genderCompatibleLikes.filter((like: any) => !like.userResponse));
      setPassedLikes(genderCompatibleLikes.filter((like: any) => like.userResponse === "left"));

      // Fetch all likes - people current user has liked
      const { data: outgoingSwipes } = await supabase
        .from("swipes")
        .select(`
          id,
          swiped_user_id,
          event_id,
          events(id, name)
        `)
        .eq("user_id", session.user.id)
        .eq("direction", "right");

      if (outgoingSwipes && outgoingSwipes.length > 0) {
        const likedUserIds = [...new Set(outgoingSwipes.map((s: any) => s.swiped_user_id))];
        
        const { data: likedProfiles } = await supabase
          .from("profiles")
          .select("id, user_id, name, age, photos, bio, interests")
          .in("user_id", likedUserIds);

        const likedProfileMap = new Map(likedProfiles?.map(p => [p.user_id, p]) || []);

        const formattedAllLikes = outgoingSwipes
          ?.map((swipe: any) => {
            const profile = likedProfileMap.get(swipe.swiped_user_id);
            if (!profile) return null;
            
            return {
              id: profile.id,
              user_id: profile.user_id,
              name: profile.name,
              age: profile.age,
              photo: profile.photos?.[0] || "/placeholder.svg",
              bio: profile.bio,
              interests: profile.interests,
              eventName: swipe.events.name,
              eventId: swipe.event_id,
              swipeId: swipe.id,
            };
          })
          .filter(Boolean) || [];

        setAllLikes(formattedAllLikes);
      }

      setLoading(false);
    };

    loadLikes();
  }, [navigate]);

  const handleLike = async (profile: ProfileWithEvent) => {
    if (!userId) return;

    try {
      // Upsert swipe record (update if exists, insert if new)
      const { error: swipeError } = await supabase
        .from("swipes")
        .upsert({
          user_id: userId,
          swiped_user_id: profile.user_id,
          event_id: profile.eventId,
          direction: "right",
        }, {
          onConflict: "user_id,swiped_user_id,event_id"
        });

      if (swipeError) throw swipeError;

      // Check if there's a match (both users in either order)
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("event_id", profile.eventId)
        .or(`and(user1_id.eq.${userId},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${userId})`)
        .maybeSingle();

      if (!match) {
        // Create match
        const { data: newMatch } = await supabase
          .from("matches")
          .insert({
            user1_id: userId,
            user2_id: profile.user_id,
            event_id: profile.eventId,
          })
          .select()
          .single();

        if (newMatch) {
          toast("It's a Match! 🎉", {
            description: `You and ${profile.name} liked each other!`,
          });
          
          setTimeout(() => {
            navigate(`/chat/${newMatch.id}`);
          }, 1000);
        }
      } else {
        // Match already exists, just navigate to it
        toast("It's a Match! 🎉", {
          description: `You and ${profile.name} liked each other!`,
        });
        
        setTimeout(() => {
          navigate(`/chat/${match.id}`);
        }, 1000);
      }

      // Remove from both lists
      setNewLikes(prev => prev.filter(p => p.id !== profile.id));
      setPassedLikes(prev => prev.filter(p => p.id !== profile.id));
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
        swiped_user_id: profile.user_id,
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

  const ProfileCard = ({ profile, isPassed = false, showActions = true }: { profile: ProfileWithEvent; isPassed?: boolean; showActions?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 
                className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                onClick={() => setSelectedProfile(profile)}
              >
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
          {showActions && (
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
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1">Your Likes</h1>
          <p className="text-white/90 text-sm">People you've shown interest in</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Tab Selector - Hidden but keeping logic */}
        {/* 
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab("new")}
              className={cn(
                "py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm",
                activeTab === "new"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              New ({newLikes.length})
            </button>
            <button
              onClick={() => setActiveTab("passed")}
              className={cn(
                "py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm",
                activeTab === "passed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Passed ({passedLikes.length})
            </button>
            <button
              onClick={() => setActiveTab("all-likes")}
              className={cn(
                "py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm",
                activeTab === "all-likes"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Likes ({allLikes.length})
            </button>
          </div>
        </Card>
        */}

        {/* Likes List - Always show All Likes */}
        <div className="space-y-4 pb-6 pt-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading your likes...</p>
            </Card>
          ) : allLikes.length > 0 ? (
            allLikes.map((profile) => (
              <ProfileCard key={profile.swipeId} profile={profile} showActions={false} />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No likes yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start swiping to build your list!
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Profile View Dialog */}
      {selectedProfile && (
        <ProfileViewDialog
          userId={selectedProfile.user_id}
          eventName={selectedProfile.eventName}
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default LikedYou;
