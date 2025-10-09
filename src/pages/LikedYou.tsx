import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LikedYou = () => {
  const [activeTab, setActiveTab] = useState<"new" | "passed">("new");

  // Mock data - will be replaced with real data from Lovable Cloud
  const newLikes = [
    {
      id: "1",
      name: "Sophie",
      age: 27,
      photo: "/placeholder.svg",
      bio: "Adventure seeker and coffee enthusiast",
      interests: ["Travel", "Coffee", "Hiking"],
      side: "Bride's side",
    },
    {
      id: "2",
      name: "Jake",
      age: 30,
      photo: "/placeholder.svg",
      bio: "Music lover who enjoys long walks and good conversations",
      interests: ["Music", "Art", "Running"],
      side: "Groom's side",
    },
  ];

  const passedLikes = [
    {
      id: "3",
      name: "Rachel",
      age: 25,
      photo: "/placeholder.svg",
      bio: "Yoga instructor with a passion for wellness",
      interests: ["Yoga", "Wellness", "Cooking"],
      side: "Bride's side",
    },
  ];

  const handleLike = (name: string) => {
    toast("It's a Match! 🎉", {
      description: `You and ${name} liked each other!`,
      action: {
        label: "Send Message",
        onClick: () => {},
      },
    });
  };

  const handlePass = (name: string) => {
    toast(`Passed on ${name}`);
  };

  const ProfileCard = ({ profile, isPassed = false }: { profile: any; isPassed?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 gradient-sunset">
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-xs text-muted-foreground">{profile.side}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile.bio}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.interests.slice(0, 3).map((interest: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            {isPassed ? (
              <Button
                size="sm"
                variant="gradient"
                className="flex-1"
                onClick={() => handleLike(profile.name)}
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
                  onClick={() => handlePass(profile.name)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Pass
                </Button>
                <Button
                  size="sm"
                  variant="gradient"
                  className="flex-1"
                  onClick={() => handleLike(profile.name)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Like
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-1">Liked You</h1>
          <p className="text-white/90 text-sm">People who are interested in you</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <Card className="p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab("new")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "new"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              New Likes ({newLikes.length})
            </button>
            <button
              onClick={() => setActiveTab("passed")}
              className={cn(
                "py-2 px-4 rounded-lg font-medium transition-all text-sm",
                activeTab === "passed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Passed ({passedLikes.length})
            </button>
          </div>
        </Card>

        {/* Likes List */}
        <div className="space-y-4 pb-6">
          {activeTab === "new" ? (
            newLikes.length > 0 ? (
              newLikes.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No new likes yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Keep swiping to find your matches!
                </p>
              </Card>
            )
          ) : passedLikes.length > 0 ? (
            passedLikes.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} isPassed />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No passed profiles</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedYou;
