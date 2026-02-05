import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";
import { useTranslation } from "react-i18next";

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
  matchId?: string | null;
};

const LikedYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myLikes, setMyLikes] = useState<ProfileWithEvent[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithEvent | null>(null);

  useEffect(() => {
    const loadMyLikes = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch people current user has liked (outgoing right swipes)
      const { data: outgoingSwipes, error } = await supabase
        .from("swipes")
        .select(`
          id,
          swiped_user_id,
          event_id,
          events(id, name)
        `)
        .eq("user_id", session.user.id)
        .eq("direction", "right");

      if (error) {
        console.error("Error loading likes:", error);
        toast.error(t('likedYou.failedLoad'));
        setLoading(false);
        return;
      }

      if (!outgoingSwipes || outgoingSwipes.length === 0) {
        setMyLikes([]);
        setLoading(false);
        return;
      }

      const likedUserIds = [...new Set(outgoingSwipes.map((s: any) => s.swiped_user_id))];

      // Fetch profiles for liked users
      const { data: likedProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, name, age, photos, bio, interests")
        .in("user_id", likedUserIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        toast.error(t('likedYou.failedLoad'));
        setLoading(false);
        return;
      }

      const likedProfileMap = new Map(likedProfiles?.map(p => [p.user_id, p]) || []);

      // Fetch unmatches to filter out unmatched users
      const { data: unmatchedUsers } = await supabase
        .from("unmatches")
        .select("unmatched_user_id, event_id")
        .eq("unmatcher_id", session.user.id);

      // Fetch blocked users (bidirectional)
      const { data: blockedData } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", session.user.id);
      
      const { data: blockedByData } = await supabase
        .from("blocked_users")
        .select("blocker_id")
        .eq("blocked_id", session.user.id);
      
      const blockedUserIds = new Set([
        ...(blockedData?.map(b => b.blocked_id) || []),
        ...(blockedByData?.map(b => b.blocker_id) || [])
      ]);

      // Create a set of unmatched user_id + event_id combinations
      const unmatchedSet = new Set(
        unmatchedUsers?.map(u => `${u.unmatched_user_id}_${u.event_id}`) || []
      );

      // Fetch matches for these liked profiles
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, event_id")
        .or(`and(user1_id.eq.${session.user.id},user2_id.in.(${likedUserIds.join(",")})),and(user2_id.eq.${session.user.id},user1_id.in.(${likedUserIds.join(",")}))`);

      // Create a map of matches by user_id and event_id
      const matchMap = new Map<string, string>();
      matches?.forEach((match: any) => {
        const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
        matchMap.set(`${otherUserId}_${match.event_id}`, match.id);
      });

      const formattedLikes = outgoingSwipes
        ?.map((swipe: any) => {
          const profile = likedProfileMap.get(swipe.swiped_user_id);
          if (!profile) return null;

          // Filter out unmatched and blocked users
          if (unmatchedSet.has(`${swipe.swiped_user_id}_${swipe.event_id}`)) {
            return null;
          }
          
          // Filter out blocked users
          if (blockedUserIds.has(swipe.swiped_user_id)) {
            return null;
          }

          const matchId = matchMap.get(`${swipe.swiped_user_id}_${swipe.event_id}`);

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
            matchId: matchId || null,
          };
        })
        .filter(Boolean) || [];

      setMyLikes(formattedLikes);
      setLoading(false);
    };

    loadMyLikes();

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMyLikes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, location.pathname, t]);

  const handleUnlike = async (profile: ProfileWithEvent) => {
    if (!userId) return;

    try {
      // Delete the swipe
      const { error } = await supabase
        .from("swipes")
        .delete()
        .eq("id", profile.swipeId);

      if (error) throw error;

      toast(t('likedYou.unliked', { name: profile.name }));
      setMyLikes(prev => prev.filter(p => p.swipeId !== profile.swipeId));
    } catch (error) {
      console.error("Error unliking:", error);
      toast.error(t('likedYou.failedUnlike'));
    }
  };

  const ProfileCard = ({ profile }: { profile: ProfileWithEvent }) => (
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
          <div className="flex gap-2">
            {profile.matchId ? (
              <Button
                size="sm"
                variant="gradient"
                className="flex-1"
                onClick={() => navigate(`/chat/${profile.matchId}`, {
                  state: {
                    matchId: profile.matchId,
                    userId: profile.user_id,
                    name: profile.name,
                    photo: profile.photo,
                    eventName: profile.eventName,
                  }
                })}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('likedYou.goChat')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleUnlike(profile)}
              >
                <X className="w-4 h-4 mr-2" />
                {t('likedYou.unlike')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1 text-[hsl(var(--title))]">{t('likedYou.title')}</h1>
          <p className="text-sm text-subtitle">{t('likedYou.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Likes List */}
        <div className="space-y-4 pb-6 pt-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">{t('likedYou.loading')}</p>
            </Card>
          ) : myLikes.length > 0 ? (
            myLikes.map((profile) => (
              <ProfileCard key={profile.swipeId} profile={profile} />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">{t('likedYou.noLikes')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('likedYou.noLikesDesc')}
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
