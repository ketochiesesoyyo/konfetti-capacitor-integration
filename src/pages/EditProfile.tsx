import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    bio: "",
    interests: [] as string[],
    photos: [] as string[],
    prompts: [] as Array<{ question: string; answer: string }>,
  });

  const [newInterest, setNewInterest] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const availablePrompts = [  
    "The most trouble I could get into tonight is…
"My favorite thing about weddings isn’t the cake, it’s…"
"If you find me on the dance floor, I’m probably…"
"I’ll flirt with you if you catch me at the… (bar / photo booth / balcony / buffet line)"
"The one thing I really want from tonight is…"
"My “wedding alter ego” is… (the champagne bandit / dance-floor menace / smooth talker)"
"The hottest moment at a wedding I’ve ever seen was…"
"If I catch the bouquet/garter, I’m expecting…"
"My favorite part of a wedding outfit is… (on me / on you)"
"The morning after a wedding, I’m usually guilty of…",
  ];

  const allInterests = [
    "Travel", "Food", "Music", "Dancing", "Photography", "Reading", "Hiking",
    "Yoga", "Cooking", "Art", "Sports", "Movies", "Gaming", "Fitness"
  ];

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile();
      }
    });

    // Check initial session
    checkInitialAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkInitialAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      await fetchProfile();
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return;
      }

      setUserId(session.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to load profile");
        return;
      }

      if (!profileData) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
          });
        
        if (insertError) {
          console.error("Error creating profile:", insertError);
          toast.error("Failed to create profile");
          return;
        }
        
        // Set default values for new profile
        setProfile({
          name: session.user.email?.split('@')[0] || 'User',
          age: "",
          gender: "",
          bio: "",
          interests: [],
          photos: [],
          prompts: [],
        });
      } else {
        // Parse prompts safely
        let parsedPrompts: Array<{ question: string; answer: string }> = [];
        if (profileData.prompts) {
          try {
            if (Array.isArray(profileData.prompts)) {
              parsedPrompts = profileData.prompts as Array<{ question: string; answer: string }>;
            }
          } catch (e) {
            console.error("Error parsing prompts:", e);
          }
        }

        setProfile({
          name: profileData.name || "",
          age: profileData.age?.toString() || "",
          gender: profileData.gender || "",
          bio: profileData.bio || "",
          interests: profileData.interests || [],
          photos: profileData.photos || [],
          prompts: parsedPrompts,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          age: profile.age ? parseInt(profile.age) : null,
          gender: profile.gender,
          bio: profile.bio,
          interests: profile.interests,
          photos: profile.photos,
          prompts: profile.prompts,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;

    const file = e.target.files[0];
    
    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error("Photo must be less than 5MB");
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image");
      return;
    }

    if (profile.photos.length >= 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setProfile({
        ...profile,
        photos: [...profile.photos, publicUrl],
      });

      toast.success("Photo uploaded!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async (photoUrl: string, index: number) => {
    if (!userId) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/profile-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0];

        const { error: deleteError } = await supabase.storage
          .from('profile-photos')
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      const newPhotos = profile.photos.filter((_, i) => i !== index);
      setProfile({
        ...profile,
        photos: newPhotos,
      });

      toast.success("Photo removed!");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handlePromptAdd = () => {
    if (profile.prompts.length >= 3) {
      toast.error("Maximum 3 prompts allowed");
      return;
    }

    const usedQuestions = profile.prompts.map(p => p.question);
    const availableQuestions = availablePrompts.filter(q => !usedQuestions.includes(q));
    
    if (availableQuestions.length === 0) {
      toast.error("No more prompts available");
      return;
    }

    setProfile({
      ...profile,
      prompts: [...profile.prompts, { question: availableQuestions[0], answer: "" }],
    });
  };

  const handlePromptRemove = (index: number) => {
    const newPrompts = profile.prompts.filter((_, i) => i !== index);
    setProfile({
      ...profile,
      prompts: newPrompts,
    });
  };

  const handlePromptUpdate = (index: number, field: 'question' | 'answer', value: string) => {
    const newPrompts = [...profile.prompts];
    newPrompts[index] = { ...newPrompts[index], [field]: value };
    setProfile({
      ...profile,
      prompts: newPrompts,
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold mb-4">Photos (Max 3)</h2>
          <div className="grid grid-cols-3 gap-3">
            {profile.photos.map((photo, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative group">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handlePhotoDelete(photo, idx)}
                  className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {profile.photos.length < 3 && (
              <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">{uploadingPhoto ? "Uploading..." : "Add Photo"}</span>
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Upload up to 3 photos. First photo will be your main photo. Max 5MB each.
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
                min="18"
                max="100"
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

        {/* Prompts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Prompts (Optional, Max 3)</h2>
              <p className="text-xs text-muted-foreground">Answer prompts to make your profile more interesting</p>
            </div>
            {profile.prompts.length < 3 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePromptAdd}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
          
          {profile.prompts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No prompts added yet. Click "Add" to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {profile.prompts.map((prompt, idx) => {
                const usedQuestions = profile.prompts.map(p => p.question);
                const availableQuestions = availablePrompts.filter(
                  q => q === prompt.question || !usedQuestions.includes(q)
                );
                
                return (
                  <div key={idx} className="space-y-2 p-4 border rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => handlePromptRemove(idx)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-2 pr-8">
                      <Label>Question</Label>
                      <Select
                        value={prompt.question}
                        onValueChange={(value) => handlePromptUpdate(idx, 'question', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQuestions.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Your Answer</Label>
                      <Textarea
                        value={prompt.answer}
                        onChange={(e) => handlePromptUpdate(idx, 'answer', e.target.value)}
                        placeholder="Type your answer here..."
                        className="min-h-[80px]"
                        maxLength={150}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {prompt.answer.length}/150
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Button 
          variant="gradient" 
          className="w-full" 
          size="lg" 
          onClick={handleSave}
          disabled={saving || !profile.name}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
