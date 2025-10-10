import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MatchChat = {
  matchId: string;
  userId: string;
  name: string;
  photo: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  eventName: string;
};

const Chats = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"matches" | "hosts">("matches");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchChats, setMatchChats] = useState<MatchChat[]>([]);

  useEffect(() => {
    const loadMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch matches
      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          id,
          user1_id,
          user2_id,
          event_id,
          matched_at,
          events(name),
          user1:profiles!matches_user1_id_fkey(id, name, photos),
          user2:profiles!matches_user2_id_fkey(id, name, photos)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('matched_at', { ascending: false });

      if (error) {
        console.error("Error loading matches:", error);
        toast.error("Failed to load matches");
        setLoading(false);
        return;
      }

      // For each match, get the last message
      const chatsWithMessages = await Promise.all(
        (matches || []).map(async (match: any) => {
          const otherUser = match.user1_id === session.user.id ? match.user2 : match.user1;
          const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("match_id", match.id)
            .neq("sender_id", session.user.id)
            .is("read_at", null);

          const timeAgo = lastMsg 
            ? getTimeAgo(new Date(lastMsg.created_at))
            : getTimeAgo(new Date(match.matched_at));

          return {
            matchId: match.id,
            userId: otherUserId,
            name: otherUser.name,
            photo: otherUser.photos?.[0] || "/placeholder.svg",
            lastMessage: lastMsg?.content || "Say hi! 👋",
            timestamp: timeAgo,
            unread: unreadCount || 0,
            eventName: match.events.name,
          };
        })
      );

      setMatchChats(chatsWithMessages);
      setLoading(false);
    };

    loadMatches();

    // Subscribe to realtime message updates
    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Reload matches when messages change
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const ChatItem = ({ chat }: { chat: MatchChat }) => (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/chat/${chat.matchId}`, { 
        state: { 
          matchId: chat.matchId,
          userId: chat.userId, 
          name: chat.name, 
          photo: chat.photo, 
          eventName: chat.eventName 
        } 
      })}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={chat.photo} alt={chat.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{chat.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{chat.eventName}</p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {chat.timestamp}
              </span>
              {chat.unread > 0 && (
                <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {chat.unread}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{chat.lastMessage}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1">Chats</h1>
          <p className="text-white/90 text-sm">Your conversations and connections</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("matches")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "matches"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Matches ({matchChats.length})
            </button>
            <button
              onClick={() => setActiveTab("hosts")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "hosts"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Hosts (0)
            </button>
          </div>
        </Card>

        {/* Chats List */}
        <div className="space-y-3 pb-6">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading chats...</p>
            </Card>
          ) : activeTab === "matches" ? (
            matchChats.length > 0 ? (
              matchChats.map((chat) => <ChatItem key={chat.matchId} chat={chat} />)
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No matches yet</p>
                <p className="text-sm text-muted-foreground">
                  Start swiping to find your perfect match!
                </p>
              </Card>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Host conversations coming soon!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
