import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

const ChatThread = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  // Mock data
  const chat = {
    name: "Emma",
    photo: "/placeholder.svg",
    event: "Sarah & James Wedding",
  };

  const messages = [
    {
      id: "1",
      from: "them",
      text: "Hey! I noticed we both love traveling 🌍",
      time: "2:30 PM",
    },
    {
      id: "2",
      from: "me",
      text: "Yes! Where's your favorite place you've been?",
      time: "2:32 PM",
    },
    {
      id: "3",
      from: "them",
      text: "Definitely Japan! The culture and food were amazing. What about you?",
      time: "2:35 PM",
    },
    {
      id: "4",
      from: "me",
      text: "That's awesome! I've always wanted to go. I loved Italy - the architecture was stunning",
      time: "2:37 PM",
    },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    
    toast.success("Message sent!");
    setMessage("");
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
            <img src={chat.photo} alt={chat.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{chat.name}</h2>
            <p className="text-xs text-white/80 truncate">{chat.event}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.from === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default ChatThread;
