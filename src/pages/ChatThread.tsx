import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chat details from navigation state or default
  const chatDetails = location.state || {
    name: "User",
    photo: "/placeholder.svg",
    eventName: "Event",
    userId: "",
  };

  useEffect(() => {
    const loadMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      if (!matchId) {
        toast.error("Invalid chat");
        navigate("/chats");
        return;
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
      setLoading(false);
    };

    loadMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          
          // Mark as read if not sent by current user
          if (payload.new.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, navigate, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !matchId) return;

    const { error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: userId,
        content: message.trim(),
      });

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
    </div>
  );
};

export default ChatThread;
