import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Camera, X, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { SortablePhoto } from "@/components/SortablePhoto";
import { handleError } from "@/lib/errorHandling";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { profileSchema } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const isNewUser = location.state?.isNewUser;
  
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    interested_in: "",
    bio: "",
    instagram_username: "",
    interests: [] as string[],
    photos: [] as string[],
    prompts: [] as Array<{ question: string; answer: string }>,
    age_min: 18,
    age_max: 99,
  });

  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    age: "",
    gender: "",
    interested_in: "",
    bio: "",
    instagram_username: "",
    interests: [] as string[],
    photos: [] as string[],
    prompts: [] as Array<{ question: string; answer: string }>,
    age_min: 18,
    age_max: 99,
  });

  const [newInterest, setNewInterest] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useState<NodeJS.Timeout | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const availablePrompts = [
    "The most trouble I could get into tonight is…",
    "My favorite thing about weddings isn't the cake, it's…",
    "If you find me on the dance floor, I'm probably…",
    "I'll flirt with you if you catch me at the… (bar / photo booth / balcony / buffet line)",
    "The one thing I really want from tonight is…",
    "My \"wedding alter ego\" is… (the champagne bandit / dance-floor menace / smooth talker)",
    "The hottest moment at a wedding I've ever seen was…",
    "If I catch the bouquet/garter, I'm expecting…",
    "My favorite part of a wedding outfit is… (on me / on you)",
    "The morning after a wedding, I'm usually guilty of…",
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

  // Auto-save effect
  useEffect(() => {
    if (!userId || loading || autoSaving) return;

    // Skip if no changes
    if (!hasChanges()) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef[0]) {
      clearTimeout(autoSaveTimeoutRef[0]);
    }

    // Set new timeout for debounced auto-save
    const timeout = setTimeout(() => {
      autoSaveProfile();
    }, 2000); // Auto-save 2 seconds after last change

    autoSaveTimeoutRef[0] = timeout;

    return () => {
      if (autoSaveTimeoutRef[0]) {
        clearTimeout(autoSaveTimeoutRef[0]);
      }
    };
  }, [profile, userId, loading]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId && !loading && hasChanges()) {
        autoSaveProfile(true); // Synchronous save
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, loading, profile]);

  const checkInitialAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      await fetchProfile();
    }
  };

  const autoSaveProfile = async (synchronous: boolean = false) => {
    if (!userId || autoSaving) return;

    if (!synchronous) setAutoSaving(true);
    
    try {
      const ageValue = profile.age ? parseInt(profile.age) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name.trim() || originalProfile.name,
          age: ageValue,
          gender: profile.gender || originalProfile.gender,
          interested_in: profile.interested_in || originalProfile.interested_in,
          bio: profile.bio?.trim(),
          instagram_username: profile.instagram_username?.trim(),
          interests: profile.interests,
          photos: profile.photos,
          prompts: profile.prompts,
          age_min: profile.age_min,
          age_max: profile.age_max,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Auto-save error:", error);
        return;
      }

      // Update original profile to match auto-saved state
      setOriginalProfile(profile);
      
      if (!synchronous) {
        console.log("Profile auto-saved");
      }
    } catch (error: any) {
      console.error("Error auto-saving profile:", error);
    } finally {
      if (!synchronous) setAutoSaving(false);
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
        handleError(profileError, "Failed to load profile", "ProfileFetch");
        return;
      }

      if (!profileData) {
        // Create profile if it doesn't exist - use upsert to avoid type issues
        const { error: insertError } = await supabase
          .from("profiles")
          .upsert({
            user_id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            gender: 'man',
            interested_in: 'both',
          }, {
            onConflict: 'user_id'
          });
        
        if (insertError) {
          handleError(insertError, "Failed to create profile", "ProfileCreate");
          return;
        }
        
        // Set default values for new profile
        const newProfileData = {
          name: session.user.email?.split('@')[0] || 'User',
          age: "",
          gender: "",
          interested_in: "",
          bio: "",
          instagram_username: "",
          interests: [],
          photos: [],
          prompts: [],
          age_min: 18,
          age_max: 99,
        };
        setProfile(newProfileData);
        setOriginalProfile(newProfileData);
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

        const loadedProfile = {
          name: profileData.name || "",
          age: profileData.age?.toString() || "",
          gender: profileData.gender || "",
          interested_in: profileData.interested_in || "",
          bio: profileData.bio || "",
          instagram_username: profileData.instagram_username || "",
          interests: profileData.interests || [],
          photos: profileData.photos || [],
          prompts: parsedPrompts,
          age_min: profileData.age_min || 18,
          age_max: profileData.age_max || 99,
        };
        setProfile(loadedProfile);
        setOriginalProfile(loadedProfile);
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

    // Validate required fields
    const isNewUser = location.state?.isNewUser;
    if (isNewUser) {
      if (!profile.name || !profile.age || !profile.gender || !profile.interested_in || profile.photos.length === 0) {
        toast.error("Please complete all required fields: Name, Age, Gender, Interested In, and at least one photo");
        return;
      }
    }

    // Validate prompts are required
    if (profile.prompts.length === 0) {
      toast.error("Please answer at least 1 prompt");
      return;
    }

    // Validate that answered prompts have content
    const hasEmptyPrompt = profile.prompts.some(p => !p.answer.trim());
    if (hasEmptyPrompt) {
      toast.error("Please complete all prompt answers");
      return;
    }

    // Validate profile data
    const ageValue = profile.age ? parseInt(profile.age) : null;
    if (ageValue !== null) {
      const validationResult = profileSchema.safeParse({
        name: profile.name,
        age: ageValue,
        bio: profile.bio,
        gender: profile.gender,
        interested_in: profile.interested_in,
        interests: profile.interests,
        age_min: profile.age_min,
        age_max: profile.age_max,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name.trim(),
          age: ageValue,
          gender: profile.gender,
          interested_in: profile.interested_in,
          bio: profile.bio?.trim(),
          instagram_username: profile.instagram_username?.trim(),
          interests: profile.interests,
          photos: profile.photos,
          prompts: profile.prompts,
          age_min: profile.age_min,
          age_max: profile.age_max,
        })
        .eq("user_id", userId);

      if (error) {
        handleError(error, "Failed to update profile", "ProfileUpdate");
        return;
      }

      toast.success("Profile updated successfully!");
      
      // Update original profile to match saved state
      setOriginalProfile(profile);
      
      // Check if there's a pending invite in URL params
      const pendingInvite = searchParams.get("invite");
      if (pendingInvite && isNewUser) {
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate("/profile");
      }
    } catch (error) {
      handleError(error, "Failed to update profile", "ProfileUpdateCatch");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;

    const file = e.target.files[0];
    
    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast.error("Photo must be less than 10MB");
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

    // Create a temporary URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setTempImageFile(file);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!userId || !tempImageFile) return;

    setUploadingPhoto(true);
    setCropDialogOpen(false);
    
    try {
      const fileExt = tempImageFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      const publicUrl = data.publicUrl;

      setProfile({
        ...profile,
        photos: [...profile.photos, publicUrl],
      });

      toast.success("Photo uploaded!");
    } catch (error) {
      handleError(error, "Failed to upload photo", "PhotoUpload");
    } finally {
      setUploadingPhoto(false);
      // Clean up temp URL
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl("");
      setTempImageFile(null);
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
      handleError(error, "Failed to delete photo", "PhotoDelete");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = profile.photos.indexOf(active.id as string);
      const newIndex = profile.photos.indexOf(over.id as string);

      const newPhotos = arrayMove(profile.photos, oldIndex, newIndex);
      setProfile({
        ...profile,
        photos: newPhotos,
      });
      
      toast.success("Photo order updated");
    }
  };

  const hasChanges = () => {
    return (
      profile.name !== originalProfile.name ||
      profile.age !== originalProfile.age ||
      profile.gender !== originalProfile.gender ||
      profile.interested_in !== originalProfile.interested_in ||
      profile.bio !== originalProfile.bio ||
      profile.instagram_username !== originalProfile.instagram_username ||
      profile.age_min !== originalProfile.age_min ||
      profile.age_max !== originalProfile.age_max ||
      JSON.stringify(profile.interests) !== JSON.stringify(originalProfile.interests) ||
      JSON.stringify(profile.photos) !== JSON.stringify(originalProfile.photos) ||
      JSON.stringify(profile.prompts) !== JSON.stringify(originalProfile.prompts)
    );
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
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[hsl(var(--title))]">Edit Profile</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-subtitle">Update your information</p>
              {autoSaving && (
                <span className="text-xs text-muted-foreground">• Saving draft...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-4">
        {/* New User Warning */}
        {location.state?.isNewUser && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {location.state?.pendingInvite 
                    ? "Please add your name, age, and at least one photo to join the wedding event!"
                    : "Fill in your profile to start matching with other singles at wedding events."}
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Photos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Photos (Max 3)</h2>
            {profile.photos.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                First photo shows in matchmaking
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Drag photos to reorder them. First photo shows in matchmaking
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={profile.photos}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-3">
                {profile.photos.map((photo, idx) => (
                  <SortablePhoto
                    key={photo}
                    id={photo}
                    photo={photo}
                    index={idx}
                    onDelete={() => handlePhotoDelete(photo, idx)}
                  />
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
            </SortableContext>
          </DndContext>
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
            <div className="space-y-2">
              <Label>I am a *</Label>
              <Select
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="man">Man</SelectItem>
                  <SelectItem value="woman">Woman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interested in *</Label>
              <Select
                value={profile.interested_in}
                onValueChange={(value) => setProfile({ ...profile, interested_in: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who are you interested in?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Age Range Preference */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Age Range</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I'm interested in people aged {profile.age_min} to {profile.age_max >= 65 ? '65+' : profile.age_max}
            </p>
            <Slider
              value={[profile.age_min, Math.min(profile.age_max, 65)]}
              onValueChange={(values) => setProfile({ ...profile, age_min: values[0], age_max: values[1] === 65 ? 99 : values[1] })}
              min={18}
              max={65}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>18</span>
              <span>65+</span>
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">About Me</h2>
          <div className="space-y-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram profile (optional)</Label>
              <Input
                id="instagram"
                value={profile.instagram_username}
                onChange={(e) => setProfile({ ...profile, instagram_username: e.target.value })}
                placeholder="@username"
                maxLength={30}
              />
            </div>
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
              <h2 className="text-lg font-semibold">Prompts (Required, Min 1, Max 3)</h2>
              <p className="text-xs text-muted-foreground">Answer at least 1 prompt to complete your profile</p>
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
            <div className="text-center py-4">
              <p className="text-sm text-destructive font-semibold mb-2">
                At least 1 prompt is required
              </p>
              <p className="text-xs text-muted-foreground">
                Click "Add" to get started!
              </p>
            </div>
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
                        <SelectContent 
                          className="max-w-[calc(100vw-2rem)] w-full z-[100]" 
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {availableQuestions.map((q) => (
                            <SelectItem key={q} value={q} className="text-sm break-words whitespace-normal h-auto py-3">
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
      </div>

      {/* Fixed Save Button - Always visible above navigation */}
      <div className="fixed left-0 right-0 flex items-center justify-center z-50 pointer-events-none px-4" style={{ bottom: '30px' }}>
        <div className="pointer-events-auto w-full max-w-lg">
          <Button 
            className={hasChanges() ? "w-full bg-primary text-white hover:bg-[hsl(var(--primary-glow))]" : "w-full bg-primary/40 text-white hover:bg-primary/60"}
            style={{ boxShadow: '0 0 12px rgba(0, 0, 0, 0.25)' }}
            size="lg" 
            onClick={handleSave}
            disabled={saving || !profile.name || profile.prompts.length === 0}
          >
            {saving ? "Saving..." : hasChanges() ? "Save Changes ●" : "Save Changes"}
          </Button>
        </div>
      </div>

      <ImageCropDialog
        open={cropDialogOpen}
        imageUrl={tempImageUrl}
        onClose={() => {
          setCropDialogOpen(false);
          URL.revokeObjectURL(tempImageUrl);
          setTempImageUrl("");
          setTempImageFile(null);
        }}
        onCropComplete={handleCropComplete}
        type="profile"
      />
    </div>
  );
};

export default EditProfile;
