import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MoreVertical, UserX, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";
import { ReportDialog } from "@/components/ReportDialog";
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
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
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
          toast.error("Invalid chat");
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
          console.error("Error loading messages:", error);
          toast.error("Failed to load messages");
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
          toast.error("Invalid chat");
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
          console.error("Error loading messages:", error);
          toast.error("Failed to load messages");
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

  const handleSend = async () => {
    if (!message.trim() || !userId) return;

    const messageData = isDirectChat ? {
      event_id: eventId,
      recipient_id: recipientId,
      sender_id: userId,
      content: message.trim(),
    } : {
      match_id: matchId,
      sender_id: userId,
      content: message.trim(),
    };

    const { error } = await supabase
      .from("messages")
      .insert(messageData);

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setMessage("");
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

      toast.success("Unmatched successfully");
      navigate("/chats");
    } catch (error) {
      console.error("Error unmatching:", error);
      toast.error("Failed to unmatch");
    }
  };

  const handleReportSubmit = () => {
    // After report is submitted, also unmatch
    handleUnmatch();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-4 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full overflow-hidden gradient-ocean flex-shrink-0">
            <img src={chatDetails.photo} alt={chatDetails.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 
              className="font-semibold truncate cursor-pointer hover:underline" 
              onClick={() => setShowProfileDialog(true)}
            >
              {chatDetails.name}
            </h2>
            <p className="text-xs text-white/80 truncate">{chatDetails.eventName}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowUnmatchDialog(true)}>
                <UserX className="w-4 h-4 mr-2" />
                Unmatch
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report & Unmatch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender_id === userId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender_id === userId ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
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
      <div className="border-t bg-card p-4 flex-shrink-0">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
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
            <AlertDialogTitle>Unmatch {chatDetails.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your match with {chatDetails.name}. You won't be able to message each other anymore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatThread;
