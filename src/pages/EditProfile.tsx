import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";

const EditProfile = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    age: "28",
    bio: "Love connecting with new people at celebrations! Looking for genuine connections.",
    interests: ["Travel", "Food", "Music", "Dancing", "Photography"],
  });

  const [newInterest, setNewInterest] = useState("");

  const allInterests = [
    "Travel", "Food", "Music", "Dancing", "Photography", "Reading", "Hiking",
    "Yoga", "Cooking", "Art", "Sports", "Movies", "Gaming", "Fitness"
  ];

  const handleSave = () => {
    toast.success("Profile updated successfully!");
    navigate("/profile");
  };

  const addInterest = (interest: string) => {
    if (profile.interests.length >= 5) {
      toast.error("Maximum 5 interests allowed");
      return;
    }
    if (!profile.interests.includes(interest)) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interest],
      });
    }
    setNewInterest("");
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((i) => i !== interest),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-white/90 text-sm">Update your information</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Photos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2].map((idx) => (
              <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative group">
                <img src="/placeholder.svg" alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                <button className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Upload up to 3 photos. First photo will be your main photo.
          </p>
        </Card>

        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">About Me</h2>
          <div className="space-y-2">
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              className="min-h-[100px]"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">
              {profile.bio.length}/150
            </p>
          </div>
        </Card>

        {/* Interests */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Interests (Max 5)</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => removeInterest(interest)}
                >
                  {interest}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>Add Interest</Label>
              <div className="flex flex-wrap gap-2">
                {allInterests
                  .filter((i) => !profile.interests.includes(i))
                  .map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </Card>

        <Button variant="gradient" className="w-full" size="lg" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
