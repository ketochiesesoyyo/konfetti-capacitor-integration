import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MessageCircle, UserX, Share2, Copy, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { eventSchema } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { ImageCropDialog } from "@/components/ImageCropDialog";

const EventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"guests" | "stats" | "settings">("guests");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [closeEventDialogOpen, setCloseEventDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Event data
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalLikes: 0,
    matchesCreated: 0,
    topActive: [] as { name: string; swipes: number }[],
  });

  // Edit mode for settings
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState({
    name: "",
    description: "",
    date: "",
    close_date: "",
  });
  
  // Image editing
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchEventData();
    
    // Handle payment success callback
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    const tab = searchParams.get('tab');
    
    if (paymentStatus === 'success' && sessionId && eventId) {
      verifyPayment(sessionId, eventId);
    }
    
    // Set active tab from URL parameter
    if (tab === 'settings' || tab === 'guests' || tab === 'stats') {
      setActiveTab(tab as "guests" | "stats" | "settings");
    }
  }, [eventId]);

  const verifyPayment = async (sessionId: string, eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId, eventId },
      });

      if (error) throw error;

      toast.success("🎉 Payment verified! Premium features activated", {
        description: "Your event now has unlimited guest capacity",
      });
      
      // Refresh event data to show updated plan
      await fetchEventData();
      
      // Remove query params from URL
      navigate(`/event-dashboard/${eventId}`, { replace: true });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed", {
        description: "Please contact support if payment was completed",
      });
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-premium-checkout', {
        body: { eventId },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success("Opening payment page...", {
          description: "Complete payment to upgrade to Premium",
        });
      }
    } catch (error: any) {
      console.error("Upgrade checkout error:", error);
      toast.error("Failed to initiate upgrade");
    }
  };

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }
  }, [activeTab]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId || "")
        .eq("created_by", user.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
      setEditedEvent({
        name: eventData.name,
        description: eventData.description || "",
        date: eventData.date,
        close_date: eventData.close_date,
      });
      
      // Set image preview if exists
      if (eventData.image_url) {
        setImagePreview(eventData.image_url);
      }

      // Fetch guests (attendees with their profiles)
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select(`
          *,
          profiles (
            id,
            user_id,
            name,
            photos
          )
        `)
        .eq("event_id", eventId || "");

      if (attendeesError) throw attendeesError;
      setGuests(attendeesData || []);

      // Fetch stats
      await fetchStats();
    } catch (error: any) {
      console.error("Error fetching event data:", error);
      toast.error("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Count total guests
      const { count: guestsCount } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "");

      // Count total likes (right swipes)
      const { count: likesCount } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "")
        .eq("direction", "right");

      // Count matches
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "");

      // Get most active users by swipe count
      const { data: swipesData } = await supabase
        .from("swipes")
        .select(`
          user_id,
          profiles (name)
        `)
        .eq("event_id", eventId || "");

      // Aggregate swipes by user
      const swipesByUser: Record<string, { name: string; count: number }> = {};
      swipesData?.forEach((swipe: any) => {
        const userId = swipe.user_id;
        const name = swipe.profiles?.name || "Unknown";
        if (!swipesByUser[userId]) {
          swipesByUser[userId] = { name, count: 0 };
        }
        swipesByUser[userId].count++;
      });

      const topActive = Object.values(swipesByUser)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((user) => ({ name: user.name, swipes: user.count }));

      setStats({
        totalGuests: guestsCount || 0,
        totalLikes: likesCount || 0,
        matchesCreated: matchesCount || 0,
        topActive,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRemoveGuest = async () => {
    if (!removalReason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId || "")
        .eq("user_id", selectedGuest.user_id);

      if (error) throw error;

      toast.success(`${selectedGuest.profiles?.name} has been removed`);
      setRemoveDialogOpen(false);
      setSelectedGuest(null);
      setRemovalReason("");
      fetchEventData(); // Refresh data
    } catch (error: any) {
      console.error("Error removing guest:", error);
      toast.error("Failed to remove guest");
    }
  };

  const handleChatWithGuest = (guest: any) => {
    navigate(`/chat/${guest.user_id}`, {
      state: {
        userId: guest.user_id,
        name: guest.profiles?.name || "Guest",
        photo: guest.profiles?.photos?.[0] || "/placeholder.svg",
        eventName: event.name,
        eventId: eventId,
        isDirectChat: true,
      }
    });
  };

  const handleSaveEvent = async () => {
    try {
      // Validate event data
      const validationResult = eventSchema.safeParse({
        name: editedEvent.name,
        description: editedEvent.description,
        date: editedEvent.date,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      let imageUrl = imagePreview;
      
      // Upload new image if changed
      if (eventImage && !imagePreview.startsWith('http')) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `${eventId}-${Date.now()}.${fileExt}`;
        
        // Delete old image if exists
        if (event.image_url) {
          const oldFileName = event.image_url.split('/').pop();
          await supabase.storage.from('event-photos').remove([oldFileName]);
        }
        
        const { error: uploadError, data } = await supabase.storage
          .from('event-photos')
          .upload(fileName, eventImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }
      
      // Calculate new close_date if date changed
      let closeDate = editedEvent.close_date;
      if (editedEvent.date !== event.date) {
        closeDate = format(addDays(new Date(editedEvent.date), 3), "yyyy-MM-dd");
      }

      const validated = validationResult.data;
      const { error } = await supabase
        .from("events")
        .update({
          name: validated.name,
          description: validated.description,
          date: validated.date,
          close_date: closeDate,
          image_url: imageUrl,
        })
        .eq("id", eventId || "");

      if (error) throw error;

      toast.success("Event updated successfully!");
      setIsEditing(false);
      setEventImage(null);
      fetchEventData(); // Refresh data
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      
      setTempImageFile(file);
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedImage: Blob) => {
    const file = new File([croppedImage], tempImageFile?.name || "event-image.jpg", {
      type: "image/jpeg",
    });
    setEventImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedImage);
    
    setCropDialogOpen(false);
    URL.revokeObjectURL(tempImageUrl);
  };

  const handleRemoveImage = () => {
    setEventImage(null);
    setImagePreview(event?.image_url || "");
  };

  const handleCloseEvent = async () => {
    try {
      // Calculate new close date: 3 days from now
      const newCloseDate = format(addDays(new Date(), 3), "yyyy-MM-dd");
      
      const { error } = await supabase
        .from("events")
        .update({ 
          status: "closed",
          close_date: newCloseDate
        })
        .eq("id", eventId || "");

      if (error) throw error;

      toast.success("Event closed successfully");
      setCloseEventDialogOpen(false);
      navigate("/");
    } catch (error: any) {
      console.error("Error closing event:", error);
      toast.error("Failed to close event");
    }
  };

  const eventCode = event?.invite_code || "";
  const eventLink = `https://konfetti-capacitor-integration.lovable.app/join/${eventCode}`;

  const handleShareLink = () => {
    navigator.clipboard.writeText(eventLink);
    toast.success("Event link copied to clipboard!");
  };

  const handleShareCode = () => {
    navigator.clipboard.writeText(eventCode);
    toast.success("Event code copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading event data...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--title))]">{event.name}</h1>
              <p className="text-sm text-subtitle">Event Dashboard</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleShareLink}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Event Link
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 px-3 py-2 rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Event Code</p>
                <p className="font-mono font-bold text-sm">{eventCode}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Tab Selector */}
        <Card className="p-1.5 mb-6 shadow-soft">
          <div className="grid grid-cols-3 gap-2">
            {["guests", "stats", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "py-3 px-4 rounded-2xl font-semibold transition-all duration-300 text-sm capitalize",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-soft scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        {activeTab === "guests" && (
          <div className="space-y-3 pb-6">
            {guests.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden gradient-sunset flex-shrink-0">
                    {guest.profiles?.photos?.[0] ? (
                      <img 
                        src={guest.profiles.photos[0]} 
                        alt={guest.profiles?.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                        {guest.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{guest.profiles?.name || "Guest"}</h3>
                      {guest.user_id === event?.created_by ? (
                        <Badge variant="default" className="text-xs">Host</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Guest</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(guest.joined_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleChatWithGuest(guest)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setRemoveDialogOpen(true);
                      }}
                    >
                      <UserX className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4 pb-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.totalGuests}</p>
                  <p className="text-sm text-muted-foreground">Total Guests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.matchesCreated}</p>
                  <p className="text-sm text-muted-foreground">Matches Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Most Active Guests</h3>
              <div className="space-y-3">
                {stats.topActive.length > 0 ? (
                  stats.topActive.map((guest, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{guest.name}</span>
                      <Badge variant="secondary">{guest.swipes} swipes</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4 pb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Event Settings</h3>
                {!isEditing ? (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedEvent({
                        name: event.name,
                        description: event.description || "",
                        date: event.date,
                        close_date: event.close_date,
                      });
                      setEventImage(null);
                      setImagePreview(event.image_url || "");
                    }}
                  >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEvent}>
                      Save
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Event Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedEvent.name}
                      onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{event.name}</p>
                  )}
                </div>
                
                <div>
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedEvent.description}
                      onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{event.description || "No description"}</p>
                  )}
                </div>
                
                <div>
                  <Label>Event Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedEvent.date}
                      onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.date), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Close Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEditing && editedEvent.date !== event.date
                      ? format(addDays(new Date(editedEvent.date), 3), "MMMM d, yyyy")
                      : format(new Date(event.close_date), "MMMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically set to 3 days after event date
                  </p>
                </div>
                
                {/* Matchmaking Schedule */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Matchmaking Schedule</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Date & Time</Label>
                      <p className="text-sm mt-1">
                        {event.matchmaking_start_date && event.matchmaking_start_time
                          ? new Date(`${event.matchmaking_start_date}T${event.matchmaking_start_time}`).toLocaleString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Immediately (not scheduled)'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Close Date</Label>
                      <p className="text-sm mt-1">
                        {event.matchmaking_close_date
                          ? format(new Date(event.matchmaking_close_date), "MMMM d, yyyy")
                          : 'Not set (closes with event)'}
                      </p>
                    </div>
                    {event.matchmaking_start_date && (
                      <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                        💡 Guests can join anytime, but won't see profiles until matchmaking starts
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Event Image */}
                <div>
                  <Label>Event Image</Label>
                  {isEditing ? (
                    <div className="mt-2 space-y-3">
                      {imagePreview && (
                        <div className="relative inline-block">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
                            <img 
                              src={imagePreview} 
                              alt="Event preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                            onClick={handleRemoveImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="event-image-upload"
                        />
                        <label htmlFor="event-image-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('event-image-upload')?.click();
                            }}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {imagePreview ? "Change Image" : "Add Image"}
                          </Button>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {event.image_url ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={event.image_url} 
                            alt="Event" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No image set</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Image Crop Dialog */}
            <ImageCropDialog
              open={cropDialogOpen}
              imageUrl={tempImageUrl}
              onClose={() => {
                setCropDialogOpen(false);
                URL.revokeObjectURL(tempImageUrl);
              }}
              onCropComplete={handleCropComplete}
            />

            {/* Upgrade to Premium */}
            {event.plan === 'free' && event.status === 'active' && (
              <Card className="p-6 border-primary/50 bg-primary/5">
                <h3 className="font-semibold mb-2">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock unlimited guests and premium features for your event.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span>Unlimited guests (currently limited to 10)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span>Advanced analytics</span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleUpgradeToPremium}
                >
                  Upgrade to Premium - $299
                </Button>
              </Card>
            )}

            <Card className="p-6 border-destructive/50">
              <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Close the event early. Matches and chats will remain.
              </p>
              <p className="text-xs text-destructive/80 mb-4">
                ⚠️ This action cannot be undone. No reimbursements will be provided after closing.
              </p>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setCloseEventDialogOpen(true)}
              >
                Close Event Now
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Remove Guest Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Guest</DialogTitle>
            <DialogDescription>
              This will delete all their matches and chats for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for removal</Label>
              <Select value={removalReason} onValueChange={setRemovalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-invited">Not invited to the wedding</SelectItem>
                  <SelectItem value="duplicate">Duplicate profile</SelectItem>
                  <SelectItem value="fake-info">Incorrect or fake info</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="behavior">Behavior issues</SelectItem>
                  <SelectItem value="not-attending">No longer attending</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRemoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRemoveGuest}
              >
                Remove Guest
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Event Confirmation Dialog */}
      <AlertDialog open={closeEventDialogOpen} onOpenChange={setCloseEventDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Event Now?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The event will be permanently closed and no further matchmaking will be possible.
              <br /><br />
              <strong>Important:</strong> No reimbursements will be provided after closing the event.
              <br /><br />
              Existing matches and chats will remain accessible to guests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCloseEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventDashboard;
