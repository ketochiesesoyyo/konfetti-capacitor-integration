import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Edit, LogOut, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to load profile");
        return;
      }

      if (!profile) {
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
          console.error("Error creating profile:", insertError);
          toast.error("Failed to create profile");
          return;
        }
        
        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        setUser(newProfile);
      } else {
        // Parse prompts safely
        let parsedPrompts: Array<{ question: string; answer: string }> = [];
        if (profile.prompts) {
          try {
            if (Array.isArray(profile.prompts)) {
              parsedPrompts = profile.prompts as Array<{ question: string; answer: string }>;
            }
          } catch (e) {
            console.error("Error parsing prompts:", e);
          }
        }

        setUser({
          ...profile,
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const prompts = user.prompts || [];
  const interests = user.interests || [];
  const photos = user.photos && user.photos.length > 0 ? user.photos : ["/placeholder.svg", "/placeholder.svg"];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="gradient-sunset text-white p-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Profile</h1>
            <p className="text-white/90 text-sm">Your dating profile for all weddings</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowPreview(true)}
              title="Preview your profile"
            >
              <Eye className="w-5 h-5" />
            </Button>
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
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Photos Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Photos</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate("/edit-profile")}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo: string, idx: number) => (
              <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            <button 
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              onClick={() => navigate("/edit-profile")}
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
        </Card>

        {/* Basic Info Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate("/edit-profile")}>
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
            <Button size="sm" variant="ghost" onClick={() => navigate("/edit-profile")}>
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
            <Button size="sm" variant="ghost" onClick={() => navigate("/edit-profile")}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          {prompts.length > 0 ? (
            <div className="space-y-4">
              {prompts.map((prompt: any, idx: number) => (
                <div key={idx}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {prompt.question}
                  </p>
                  <p className="text-foreground">{prompt.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No prompts added yet</p>
          )}
        </Card>

        {/* Interests Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Interests</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate("/edit-profile")}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No interests added yet</p>
          )}
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh]">
          {/* Fully Scrollable Preview */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* First Photo with Name Overlay */}
            <div className="relative aspect-[3/4]">
              <img
                src={user?.photos?.[0] || "/placeholder.svg"}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <h2 className="text-3xl font-bold mb-1">
                  {user?.name || "User"}, {user?.age || "?"}
                </h2>
                <p className="text-sm text-white/80">Preview Mode</p>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-4 bg-background">
            {/* Bio */}
            {user?.bio && (
              <div>
                <h3 className="font-semibold mb-1">About</h3>
                <p className="text-foreground">{user.bio}</p>
              </div>
            )}

            {/* Second Photo */}
            {user?.photos?.[1] && (
              <div className="rounded-lg overflow-hidden aspect-[3/4]">
                <img 
                  src={user.photos[1]} 
                  alt="Photo 2" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Third Photo */}
            {user?.photos?.[2] && (
              <div className="rounded-lg overflow-hidden aspect-[3/4]">
                <img 
                  src={user.photos[2]} 
                  alt="Photo 3" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Prompts */}
            {user?.prompts && user.prompts.length > 0 && user.prompts.map((prompt: any, idx: number) => (
              <div key={idx}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  {prompt.question}
                </h3>
                <p className="text-foreground">{prompt.answer}</p>
              </div>
            ))}

            {/* Interests */}
            {user?.interests && user.interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!user?.bio && (!user?.prompts || user.prompts.length === 0) && (!user?.interests || user.interests.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Add more details to your profile to show here!
              </p>
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
