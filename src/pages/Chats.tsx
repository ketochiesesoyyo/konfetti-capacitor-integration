import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const Chats = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "hosts">("matches");

  // Mock data - will be replaced with real data from Lovable Cloud
  const matchChats = [
    {
      id: "1",
      name: "Emma",
      photo: "/placeholder.svg",
      lastMessage: "That sounds amazing! When are you free?",
      timestamp: "2m ago",
      unread: 2,
      event: "Sarah & James Wedding",
    },
    {
      id: "2",
      name: "Michael",
      photo: "/placeholder.svg",
      lastMessage: "I love that restaurant! Have you been there before?",
      timestamp: "1h ago",
      unread: 0,
      event: "Sarah & James Wedding",
    },
  ];

  const hostChats = [
    {
      id: "1",
      name: "Sarah & James",
      photo: "/placeholder.svg",
      lastMessage: "Welcome to our wedding! Feel free to reach out if you have any questions.",
      timestamp: "2d ago",
      unread: 0,
      event: "Sarah & James Wedding",
    },
  ];

  const ChatItem = ({ chat }: { chat: any }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={chat.photo} alt={chat.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{chat.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{chat.event}</p>
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
              Hosts ({hostChats.length})
            </button>
          </div>
        </Card>

        {/* Chats List */}
        <div className="space-y-3 pb-6">
          {activeTab === "matches" ? (
            matchChats.length > 0 ? (
              matchChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No matches yet</p>
                <p className="text-sm text-muted-foreground">
                  Start swiping to find your perfect match!
                </p>
              </Card>
            )
          ) : hostChats.length > 0 ? (
            hostChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No host conversations</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
