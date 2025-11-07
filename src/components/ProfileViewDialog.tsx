import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Profile = {
  name: string;
  age: number | null;
  photos: string[];
  bio: string | null;
  instagram_username: string | null;
  interests: string[] | null;
  prompts: Array<{ question: string; answer: string }> | null;
};

type ProfileViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  eventName?: string;
};

export const ProfileViewDialog = ({ open, onOpenChange, userId, eventName }: ProfileViewDialogProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("name, age, photos, bio, instagram_username, interests, prompts")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile({
        name: data.name,
        age: data.age,
        photos: data.photos || [],
        bio: data.bio,
        instagram_username: data.instagram_username,
        interests: data.interests,
        prompts: data.prompts as Array<{ question: string; answer: string }> | null,
      });
    }
    setLoading(false);
  };

  if (!profile && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Single scrollable container */}
        <div className="overflow-y-auto max-h-[90vh]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading profile...
            </div>
          ) : (
            <>
              {/* Photos Section */}
              <div className="relative h-[400px] gradient-sunset">
                {profile?.photos && profile.photos.length > 0 ? (
                  <>
                    <img
                      src={profile.photos[currentPhotoIndex]}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    {profile.photos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {profile.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentPhotoIndex
                                ? "w-8 bg-white"
                                : "w-2 bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/60">No photos</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-6">
                {/* Name and Age */}
                <div>
                  <h2 className="text-2xl font-bold">
                    {profile?.name}, {profile?.age || "?"}
                  </h2>
                  {eventName && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{eventName}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    {profile.instagram_username && (
                      <p className="text-sm text-primary mt-2">@{profile.instagram_username}</p>
                    )}
                  </div>
                )}

                {/* Interests */}
                {profile?.interests && profile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {profile?.prompts && profile.prompts.length > 0 && (
                  <div className="space-y-4">
                    {profile.prompts.map((prompt, idx) => (
                      <div key={idx} className="space-y-1">
                        <h3 className="font-semibold text-sm">{prompt.question}</h3>
                        <p className="text-sm text-muted-foreground">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
