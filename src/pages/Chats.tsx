import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatActionsMenu } from "@/components/ChatActionsMenu";
import { ReportDialog } from "@/components/ReportDialog";
import { UnmatchDialog } from "@/components/UnmatchDialog";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { useTranslation } from "react-i18next";

type MatchChat = {
  matchId: string;
  userId: string;
  name: string;
  photo: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  eventName: string;
  eventId: string;
};

type HostChat = {
  eventId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  eventName: string;
};

// Chats page component
const Chats = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"matches" | "hosts">("matches");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchChats, setMatchChats] = useState<MatchChat[]>([]);
  const [hostChats, setHostChats] = useState<HostChat[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<MatchChat | null>(null);

  const loadMatches = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);

    // Fetch user's blocked users
    const { data: blockedData } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", session.user.id);
    
    // Also get users who blocked the current user
    const { data: blockedByData } = await supabase
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocked_id", session.user.id);
    
    const blockedUserIds = new Set([
      ...(blockedData?.map(b => b.blocked_id) || []),
      ...(blockedByData?.map(b => b.blocker_id) || [])
    ]);

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

    // Filter out blocked users
    const filteredMatches = (matches || []).filter((match: any) => {
      const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
      return !blockedUserIds.has(otherUserId);
    });

    // For each match, get the last message
    const chatsWithMessages = await Promise.all(
      filteredMatches.map(async (match: any) => {
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
          lastMessage: lastMsg?.content || t('chats.sayHi'),
          timestamp: timeAgo,
          unread: unreadCount || 0,
          eventName: match.events.name,
          eventId: match.event_id,
        };
      })
    );

    setMatchChats(chatsWithMessages);
    
    // Fetch direct messages from hosts
    await loadHostChats(session.user.id);
    
    setLoading(false);
  };

  const loadHostChats = async (currentUserId: string) => {
    // Get all events where the user is a guest
    const { data: attendeeEvents } = await supabase
      .from("event_attendees")
      .select("event_id, events(id, name, created_by)")
      .eq("user_id", currentUserId);

    if (!attendeeEvents) return;

    // For each event, check for direct messages from the host
    const hostChatsData = await Promise.all(
      attendeeEvents
        .filter((ae: any) => ae.events.created_by !== currentUserId) // Exclude own events
        .map(async (ae: any) => {
          const eventId = ae.events.id;
          const hostId = ae.events.created_by;

          // Get last message from host
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("event_id", eventId)
            .or(`and(sender_id.eq.${hostId},recipient_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},recipient_id.eq.${hostId})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!lastMsg) return null; // No messages yet

          // Count unread messages from host
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("event_id", eventId)
            .eq("sender_id", hostId)
            .eq("recipient_id", currentUserId)
            .is("read_at", null);

          // Get host profile
          const { data: hostProfile } = await supabase
            .from("profiles")
            .select("name, photos")
            .eq("user_id", hostId)
            .single();

          return {
            eventId,
            hostId,
            hostName: hostProfile?.name || "Host",
            hostPhoto: hostProfile?.photos?.[0] || "/placeholder.svg",
            lastMessage: lastMsg.content,
            timestamp: getTimeAgo(new Date(lastMsg.created_at)),
            unread: unreadCount || 0,
            eventName: ae.events.name,
          };
        })
    );

    // Filter out null values
    setHostChats(hostChatsData.filter((chat): chat is HostChat => chat !== null));
  };

  useEffect(() => {
    loadMatches();

    // Subscribe to realtime match updates
    const channel = supabase
      .channel('matches-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          // Reload matches when matches change (including deletes)
          loadMatches();
        }
      )
      .subscribe();

    // Subscribe to realtime message updates
    const messagesChannel = supabase
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

    // Reload chats when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMatches();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return t('chats.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('chats.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('chats.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('chats.daysAgo', { count: days });
  };

  const handleReportAndUnmatch = (chat: MatchChat) => {
    setSelectedChat(chat);
    setReportDialogOpen(true);
  };

  const handleUnmatch = (chat: MatchChat) => {
    setSelectedChat(chat);
    setUnmatchDialogOpen(true);
  };

  const handleBlock = (chat: MatchChat) => {
    setSelectedChat(chat);
    setBlockDialogOpen(true);
  };

  const handleActionComplete = async () => {
    // Wait a moment for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    // Reload chats from database after unmatch/report/block
    await loadMatches();
    setSelectedChat(null);
  };

  const ChatItem = ({ chat }: { chat: MatchChat }) => (
    <Card 
      className="p-5 hover-lift shadow-card cursor-pointer active-press animate-enter transition-all"
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
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 gradient-sunset shadow-soft hover-scale transition-all">
          <img src={chat.photo} alt={chat.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{chat.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{chat.eventName}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {chat.timestamp}
                </span>
                {chat.unread > 0 && (
                  <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1.5 animate-bounce-in">
                    {chat.unread > 9 ? '9+' : chat.unread}
                  </Badge>
                )}
              </div>
              <ChatActionsMenu
                onReportAndUnmatch={() => handleReportAndUnmatch(chat)}
                onUnmatch={() => handleUnmatch(chat)}
                onBlock={() => handleBlock(chat)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{chat.lastMessage}</p>
        </div>
      </div>
    </Card>
  );

  const HostChatItem = ({ chat }: { chat: HostChat }) => (
    <Card 
      className="p-5 hover-lift shadow-card cursor-pointer active-press animate-enter transition-all"
      onClick={() => navigate(`/chat/${chat.hostId}`, { 
        state: { 
          userId: chat.hostId, 
          name: chat.hostName, 
          photo: chat.hostPhoto, 
          eventName: chat.eventName,
          eventId: chat.eventId,
          isDirectChat: true,
        } 
      })}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={chat.hostPhoto} alt={chat.hostName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{chat.hostName}</h3>
              <p className="text-xs text-muted-foreground truncate">{chat.eventName}</p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {chat.timestamp}
              </span>
              {chat.unread > 0 && (
                <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {chat.unread > 9 ? '9+' : chat.unread}
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
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1 text-[hsl(var(--title))]">{t('chats.title')}</h1>
          <p className="text-sm text-subtitle">{t('chats.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Tab Selector */}
        <Card className="p-1.5 mb-6 shadow-soft">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("matches")}
              className={cn(
                "py-3 px-5 rounded-2xl font-semibold transition-all duration-300 text-sm",
                activeTab === "matches"
                  ? "bg-primary text-primary-foreground shadow-soft scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              {t('chats.matches')} ({matchChats.length})
            </button>
            <button
              onClick={() => setActiveTab("hosts")}
              className={cn(
                "py-3 px-5 rounded-2xl font-semibold transition-all duration-300 text-sm",
                activeTab === "hosts"
                  ? "bg-primary text-primary-foreground shadow-soft scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              {t('chats.hosts')} ({hostChats.length})
            </button>
          </div>
        </Card>

        {/* Chats List */}
        <div className="space-y-3 pb-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 animate-enter" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full animate-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 animate-shimmer rounded-2xl" />
                      <div className="h-4 w-3/4 animate-shimmer rounded-2xl" />
                      <div className="h-3 w-1/4 animate-shimmer rounded-2xl" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : activeTab === "matches" ? (
            matchChats.length > 0 ? (
              matchChats.map((chat) => <ChatItem key={chat.matchId} chat={chat} />)
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">{t('chats.noMatches')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('chats.noMatchesDesc')}
                </p>
              </Card>
            )
          ) : (
            hostChats.length > 0 ? (
              hostChats.map((chat) => <HostChatItem key={`${chat.eventId}-${chat.hostId}`} chat={chat} />)
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">{t('chats.noHosts')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('chats.noHostsDesc')}
                </p>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Report Dialog */}
      {selectedChat && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportedUserId={selectedChat.userId}
          reportedUserName={selectedChat.name}
          matchId={selectedChat.matchId}
          eventId={selectedChat.eventId}
          onReportSubmit={handleActionComplete}
        />
      )}

      {/* Unmatch Dialog */}
      {selectedChat && (
        <UnmatchDialog
          open={unmatchDialogOpen}
          onOpenChange={setUnmatchDialogOpen}
          matchedUserId={selectedChat.userId}
          matchedUserName={selectedChat.name}
          matchId={selectedChat.matchId}
          eventId={selectedChat.eventId}
          onUnmatchComplete={handleActionComplete}
        />
      )}

      {/* Block User Dialog */}
      {selectedChat && (
        <BlockUserDialog
          open={blockDialogOpen}
          onOpenChange={setBlockDialogOpen}
          blockedUserId={selectedChat.userId}
          blockedUserName={selectedChat.name}
          matchId={selectedChat.matchId}
          eventId={selectedChat.eventId}
          onBlockComplete={handleActionComplete}
        />
      )}
    </div>
  );
};

export default Chats;
