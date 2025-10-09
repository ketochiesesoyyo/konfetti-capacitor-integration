import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"attending" | "hosting">("attending");

  // Mock data - will be replaced with real data from Lovable Cloud
  const mockAttendingEvents = [
    {
      id: "1",
      coupleName: "Sarah & James",
      date: "2025-11-15",
      status: "active",
      theme: "sunset",
      guestCount: 47,
    },
  ];

  const mockHostingEvents = [];

  const getThemeClass = (theme: string) => {
    const themes = {
      sunset: "gradient-sunset",
      ocean: "gradient-ocean",
      golden: "gradient-golden",
      emerald: "gradient-emerald",
      midnight: "gradient-midnight",
    };
    return themes[theme as keyof typeof themes] || themes.sunset;
  };

  const handleCreateEvent = () => {
    // Show paywall modal - will be implemented with real payment flow
    navigate("/create-event");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1">My Weddings</h1>
          <p className="text-white/90 text-sm">Find your perfect match at every celebration</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("attending")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "attending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              I'm Attending
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "hosting"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              I'm Hosting
            </button>
          </div>
        </Card>

        {/* Events List */}
        <div className="space-y-4 pb-6">
          {activeTab === "attending" ? (
            mockAttendingEvents.length > 0 ? (
              mockAttendingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={cn("h-24", getThemeClass(event.theme))} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{event.coupleName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={event.status === "active" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Users className="w-4 h-4" />
                      <span>{event.guestCount} guests</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => navigate("/matchmaking")}
                      >
                        Open Event
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/event-dashboard")}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Join a wedding using an invite link from your hosts!
                </p>
                <Button variant="outline" onClick={() => navigate("/join-event")}>
                  Enter Event Code
                </Button>
              </Card>
            )
          ) : mockHostingEvents.length > 0 ? (
            mockHostingEvents.map((event: any) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{event.coupleName}</h3>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1">
                    Manage Guests
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Share Link
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any events yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a private matchmaking space for your wedding guests
              </p>
            </Card>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 flex flex-col gap-3">
          <Button
            variant="gradient"
            size="lg"
            className="shadow-xl"
            onClick={handleCreateEvent}
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="shadow-xl bg-background"
            onClick={() => navigate("/join-event")}
          >
            Join Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
