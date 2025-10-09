import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  
  // Mock user data - will be replaced with real data from Lovable Cloud
  const [user] = useState({
    name: "Alex Johnson",
    age: 28,
    gender: "Female",
    bio: "Love connecting with new people at celebrations! Looking for genuine connections.",
    interests: ["Travel", "Food", "Music", "Dancing", "Photography"],
    photos: ["/placeholder.svg", "/placeholder.svg"],
    prompts: [
      { question: "My perfect date would be...", answer: "Dancing under the stars at a rooftop venue" },
      { question: "I'm looking for...", answer: "Someone who loves adventure and spontaneity" },
    ],
  });

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Profile</h1>
            <p className="text-white/90 text-sm">Your dating profile for all weddings</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Photos Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Photos</h2>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {user.photos.map((photo, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            <button className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
        </Card>

        {/* Basic Info Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name & Age</p>
              <p className="font-medium">{user.name}, {user.age}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium">{user.gender}</p>
            </div>
          </div>
        </Card>

        {/* Bio Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">About Me</h2>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <p className="text-foreground">{user.bio}</p>
        </Card>

        {/* Prompts Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Prompts</h2>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-4">
            {user.prompts.map((prompt, idx) => (
              <div key={idx}>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {prompt.question}
                </p>
                <p className="text-foreground">{prompt.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Interests Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Interests</h2>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1">
                {interest}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
