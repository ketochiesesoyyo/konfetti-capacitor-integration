import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, UserX, Flag, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/errorHandling";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  match_id?: string;
  event_id?: string;
  recipient_id?: string;
};

const ChatThread = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: matchId } = useParams();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [eventId, setEventId] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [isDirectChat, setIsDirectChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chat details from navigation state or default
  const chatDetails = location.state || {
    name: "User",
    photo: "/placeholder.svg",
    eventName: "Event",
    userId: "",
    eventId: "",
    isDirectChat: false,
    fromAdmin: false,
  };

  const handleBack = () => {
    if (chatDetails.fromAdmin && chatDetails.eventId) {
      navigate(`/event-dashboard/${chatDetails.eventId}?from=admin`);
    } else {
      navigate("/chats");
    }
  };

  useEffect(() => {
    const loadMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Check if this is a direct chat or match-based chat
      const directChat = chatDetails.isDirectChat || location.state?.isDirectChat;
      setIsDirectChat(directChat);

      if (directChat) {
        // Direct messaging: use event_id and recipient_id
        const eventIdFromState = chatDetails.eventId || location.state?.eventId;
        const recipientIdFromState = chatDetails.userId || location.state?.userId;
        
        if (!eventIdFromState || !recipientIdFromState) {
          toast.error(t('chatThread.invalidChat'));
          navigate("/chats");
          return;
        }

        setEventId(eventIdFromState);
        setRecipientId(recipientIdFromState);

        // Fetch direct messages
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("event_id", eventIdFromState)
          .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${recipientIdFromState}),and(sender_id.eq.${recipientIdFromState},recipient_id.eq.${session.user.id})`)
          .order("created_at", { ascending: true });

        if (error) {
          handleError(error, "Failed to load messages", "MessagesLoad");
        } else {
          setMessages(data || []);
          
          // Mark unread messages as read
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("event_id", eventIdFromState)
            .eq("sender_id", recipientIdFromState)
            .eq("recipient_id", session.user.id)
            .is("read_at", null);
        }
      } else {
        // Match-based messaging
        if (!matchId) {
          toast.error(t('chatThread.invalidChat'));
          navigate("/chats");
          return;
        }

        // Fetch match to get event_id
        const { data: matchData } = await supabase
          .from("matches")
          .select("event_id")
          .eq("id", matchId)
          .single();
        
        if (matchData) {
          setEventId(matchData.event_id);
        }

        // Fetch messages
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (error) {
          handleError(error, "Failed to load messages", "MessagesLoadMatch");
        } else {
          setMessages(data || []);
          
          // Mark unread messages as read
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("match_id", matchId)
            .neq("sender_id", session.user.id)
            .is("read_at", null);
        }
      }
      setLoading(false);
    };

    loadMessages();

    // Subscribe to realtime messages
    const channelName = isDirectChat ? `direct-${eventId}-${recipientId}` : `messages-${matchId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: isDirectChat ? `event_id=eq.${eventId}` : `match_id=eq.${matchId}`
        },
        (payload) => {
          // Only add message if it's relevant to this conversation
          const newMsg = payload.new as Message;
          if (isDirectChat) {
            if ((newMsg.sender_id === userId && newMsg.recipient_id === recipientId) ||
                (newMsg.sender_id === recipientId && newMsg.recipient_id === userId)) {
              setMessages((prev) => [...prev, newMsg]);
            }
          } else {
            setMessages((prev) => [...prev, newMsg]);
          }
          
          // Mark as read if not sent by current user
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, navigate, userId, isDirectChat, eventId, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const messageSchema = z.object({
    content: z.string()
      .trim()
      .min(1, "Message cannot be empty")
      .max(5000, "Message too long (max 5000 characters)")
  });

  const handleSend = async () => {
    if (!userId) return;

    try {
      const validated = messageSchema.parse({ content: message });

      const messageData = isDirectChat ? {
        event_id: eventId,
        recipient_id: recipientId,
        sender_id: userId,
        content: validated.content,
      } : {
        match_id: matchId,
        sender_id: userId,
        content: validated.content,
      };

      const { error } = await supabase
        .from("messages")
        .insert(messageData);

      if (error) {
        handleError(error, "Failed to send message", "MessageSend");
      } else {
        setMessage("");
        
        // Send email notification (don't await - fire and forget)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const conversationId = isDirectChat 
            ? `direct-${eventId}-${userId}-${recipientId}` 
            : matchId;
          
          supabase.functions
            .invoke("new-message-notification", {
              body: {
                eventId,
                conversationId,
                senderId: userId,
                recipientId: isDirectChat ? recipientId : chatDetails.userId,
              },
            })
            .catch((err) => {
              console.error("Failed to send email notification:", err);
            });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleUnmatch = async () => {
    if (!matchId) return;

    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (error) throw error;

      toast.success(t('chatThread.unmatchedSuccess'));
      navigate("/chats");
    } catch (error) {
      handleError(error, "Failed to unmatch", "Unmatch");
    }
  };

  const handleReportSubmit = () => {
    // After report is submitted, also unmatch
    handleUnmatch();
  };

  return (
    <div className="flex flex-col h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar 
            className="w-12 h-12 cursor-pointer"
            onClick={() => setShowProfileDialog(true)}
          >
            <AvatarImage src={chatDetails.photo} alt={chatDetails.name} />
            <AvatarFallback>{chatDetails.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setShowProfileDialog(true)}
          >
            <h1 className="text-3xl font-bold text-[hsl(var(--title))] hover:underline truncate">
              {chatDetails.name}
            </h1>
            <p className="text-sm mt-1 text-subtitle truncate">{chatDetails.eventName}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowUnmatchDialog(true)}>
                <UserX className="w-4 h-4 mr-2" />
                {t('chatThread.unmatch')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowBlockDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                {t('chats.blockUser')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="w-4 h-4 mr-2" />
                {t('chats.reportAndUnmatch')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t('chatThread.loadingMessages')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t('chatThread.noMessages')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-3xl px-5 py-3 shadow-soft transition-all",
                  msg.sender_id === userId
                    ? "gradient-primary text-white"
                    : "bg-card border border-border/50"
                )}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={cn(
                    "text-xs mt-1.5",
                    msg.sender_id === userId ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4 flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('chatThread.typeMessage')}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="gradient"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Profile View Dialog */}
      <ProfileViewDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        userId={chatDetails.userId}
        eventName={chatDetails.eventName}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={chatDetails.userId}
        reportedUserName={chatDetails.name}
        matchId={matchId || ""}
        eventId={eventId}
        onReportSubmit={handleReportSubmit}
      />

      {/* Unmatch Confirmation Dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chatThread.unmatchTitle', { name: chatDetails.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chatThread.unmatchDesc', { name: chatDetails.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('chatThread.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('chatThread.unmatch')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block User Dialog */}
      <BlockUserDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blockedUserId={chatDetails.userId}
        blockedUserName={chatDetails.name}
        matchId={matchId}
        eventId={eventId}
      />
    </div>
  );
};

export default ChatThread;
