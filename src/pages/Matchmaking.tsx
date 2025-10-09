import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Heart, Info } from "lucide-react";
import { toast } from "sonner";

const Matchmaking = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock profiles - will be replaced with real data from Lovable Cloud
  const profiles = [
    {
      id: "1",
      name: "Emma",
      age: 26,
      photos: ["/placeholder.svg", "/placeholder.svg"],
      prompts: [
        { question: "I'm looking for...", answer: "Someone who loves good conversation and spontaneous adventures" },
        { question: "My ideal Sunday...", answer: "Brunch with friends, then exploring a new part of the city" },
      ],
      bio: "Marketing manager who loves trying new restaurants and weekend getaways",
      interests: ["Travel", "Food", "Yoga", "Reading"],
      side: "Bride's side",
    },
    {
      id: "2",
      name: "Michael",
      age: 29,
      photos: ["/placeholder.svg"],
      prompts: [
        { question: "My perfect date would be...", answer: "Wine tasting followed by a cooking class together" },
      ],
      bio: "Software engineer with a passion for music and photography",
      interests: ["Photography", "Music", "Hiking", "Cooking"],
      side: "Groom's side",
    },
  ];

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length - 1;

  const handleSwipe = (liked: boolean) => {
    if (liked) {
      toast.success("Liked! 💕");
      // Random chance of match for demo
      if (Math.random() > 0.5) {
        setTimeout(() => {
          toast("It's a Match! 🎉", {
            description: `You and ${currentProfile.name} liked each other!`,
            action: {
              label: "Send Message",
              onClick: () => {},
            },
          });
        }, 500);
      }
    } else {
      toast("Passed");
    }

    if (hasMoreProfiles) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast("You've seen everyone! Check back later.", {
        description: "New guests may join the wedding soon.",
      });
    }
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
          <p className="text-muted-foreground">
            You've seen everyone! Check back later when more guests join.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-sunset text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Matchmaking</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {profiles.length - currentIndex} left
          </Badge>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="overflow-hidden shadow-xl animate-slide-up">
            {/* Photo Section */}
            <div className="relative h-[450px] gradient-sunset">
              <img
                src={currentProfile.photos[0]}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <h2 className="text-3xl font-bold mb-1">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                <p className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {currentProfile.side}
                </p>
              </div>
            </div>

            {/* Info Section - Scrollable */}
            <div className="p-6 max-h-[250px] overflow-y-auto space-y-4">
              {/* Bio */}
              {currentProfile.bio && (
                <div>
                  <h3 className="font-semibold mb-1">About</h3>
                  <p className="text-foreground">{currentProfile.bio}</p>
                </div>
              )}

              {/* Prompts */}
              {currentProfile.prompts.map((prompt, idx) => (
                <div key={idx}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {prompt.question}
                  </h3>
                  <p className="text-foreground">{prompt.answer}</p>
                </div>
              ))}

              {/* Interests */}
              {currentProfile.interests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-2 hover:border-destructive hover:bg-destructive/10"
              onClick={() => handleSwipe(false)}
            >
              <X className="w-8 h-8 text-destructive" />
            </Button>
            <Button
              size="lg"
              variant="gradient"
              className="rounded-full w-20 h-20 shadow-xl"
              onClick={() => handleSwipe(true)}
            >
              <Heart className="w-10 h-10" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;
