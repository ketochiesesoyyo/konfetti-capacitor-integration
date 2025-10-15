import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Check, Camera, X } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { toast } from "sonner";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get("edit");

  const [showPaywall, setShowPaywall] = useState(true);
  const [isPaid] = useState(false); // Will be connected to real payment state
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useState<NodeJS.Timeout | null>(null);

  const [eventData, setEventData] = useState({
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
    theme: "sunset",
    agreedToTerms: false,
    selectedPlan: "",
    expectedGuests: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);

        // Load draft if editing
        if (editEventId) {
          await loadDraftEvent(editEventId, session.user.id);
        } else {
          // Check for existing auto-saved draft
          await loadExistingDraft(session.user.id);
        }
      }
    };
    checkAuth();
  }, [navigate, editEventId]);

  // Auto-save effect
  useEffect(() => {
    if (!userId || loadingDraft) return;

    // Skip if we haven't passed the paywall yet (unless editing)
    if (showPaywall && !editEventId) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef[0]) {
      clearTimeout(autoSaveTimeoutRef[0]);
    }

    // Set new timeout for debounced auto-save
    const timeout = setTimeout(() => {
      autoSaveDraft();
    }, 2000); // Auto-save 2 seconds after last change

    autoSaveTimeoutRef[0] = timeout;

    return () => {
      if (autoSaveTimeoutRef[0]) {
        clearTimeout(autoSaveTimeoutRef[0]);
      }
    };
  }, [eventData, imagePreview, userId, loadingDraft, showPaywall]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Trigger immediate save on unload if we have a draft started
      if (userId && !loadingDraft && draftEventId) {
        autoSaveDraft(true); // Pass true for synchronous save
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [userId, loadingDraft, draftEventId]);

  const loadExistingDraft = async (userId: string) => {
    try {
      // Look for the most recent draft by this user
      const { data: drafts, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", userId)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (drafts && drafts.length > 0) {
        const draft = drafts[0];
        setDraftEventId(draft.id);

        // Parse event name to extract couple names
        const nameParts = draft.name.split(" & ");
        setEventData({
          coupleName1: nameParts[0] === "Draft Event" ? "" : nameParts[0] || "",
          coupleName2: nameParts[1] || "",
          eventDate: draft.date || "",
          theme: "sunset",
          agreedToTerms: true,
          selectedPlan: "",
          expectedGuests: 0,
        });

        // Set image preview if exists
        if (draft.image_url) {
          setImagePreview(draft.image_url);
        }

        toast.success("Loaded your draft", {
          description: "Continue where you left off",
        });
      }
    } catch (error: any) {
      console.error("Error loading existing draft:", error);
    }
  };

  const loadDraftEvent = async (eventId: string, userId: string) => {
    setLoadingDraft(true);
    try {
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("created_by", userId)
        .eq("status", "draft")
        .single();

      if (error) throw error;

      if (event) {
        setDraftEventId(event.id);

        // Parse event name to extract couple names
        const nameParts = event.name.split(" & ");
        setEventData({
          coupleName1: nameParts[0] === "Draft Event" ? "" : nameParts[0] || "",
          coupleName2: nameParts[1] || "",
          eventDate: event.date || "",
          theme: "sunset",
          agreedToTerms: true,
          selectedPlan: "",
          expectedGuests: 0,
        });

        // Set image preview if exists
        if (event.image_url) {
          setImagePreview(event.image_url);
        }

        setShowPaywall(false); // Skip paywall for drafts
      }
    } catch (error: any) {
      console.error("Error loading draft:", error);
      toast.error("Failed to load draft event");
    } finally {
      setLoadingDraft(false);
    }
  };

  const initializeDraft = async () => {
    if (!userId || draftEventId) return; // Don't create if we already have one

    try {
      // Create initial empty draft
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: "Draft Event",
          date: null,
          close_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          description: "Wedding celebration",
          invite_code: `DRAFT-${Date.now()}`,
          created_by: userId,
          image_url: null,
          status: "draft",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      setDraftEventId(event.id);

      // Auto-join creator to the event
      await supabase.from("event_attendees").insert({
        event_id: event.id,
        user_id: userId,
      });

      console.log("Initialized empty draft");
    } catch (error: any) {
      console.error("Error initializing draft:", error);
    }
  };

  const autoSaveDraft = async (synchronous: boolean = false) => {
    if (!userId || autoSaving) return;

    // Don't auto-save if we're already in edit mode with editEventId
    if (editEventId) return;

    if (!synchronous) setAutoSaving(true);

    try {
      let imageUrl = imagePreview;

      // Upload event image if provided and not already uploaded
      if (eventImage && !imagePreview.startsWith("http")) {
        const fileExt = eventImage.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("event-photos").upload(fileName, eventImage);

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("event-photos").getPublicUrl(fileName);

          imageUrl = publicUrl;
        }
      }

      const inviteCode =
        eventData.coupleName1 && eventData.coupleName2 && eventData.eventDate
          ? generateInviteCode()
          : `DRAFT-${Date.now()}`;

      const eventName =
        eventData.coupleName1 && eventData.coupleName2
          ? `${eventData.coupleName1} & ${eventData.coupleName2}`
          : "Draft Event";

      const closeDate = eventData.eventDate
        ? new Date(new Date(eventData.eventDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      if (draftEventId) {
        // Update existing draft
        const { error: updateError } = await supabase
          .from("events")
          .update({
            name: eventName,
            date: eventData.eventDate || null,
            close_date: closeDate,
            description: `Wedding celebration for ${eventName}`,
            invite_code: inviteCode,
            image_url: imageUrl || null,
          })
          .eq("id", draftEventId)
          .eq("created_by", userId);

        if (updateError) throw updateError;
      } else {
        // Create new draft (should happen via initializeDraft now, but keeping as fallback)
        await initializeDraft();
      }

      if (!synchronous) {
        console.log("Auto-saved draft");
      }
    } catch (error: any) {
      console.error("Error auto-saving draft:", error);
    } finally {
      if (!synchronous) setAutoSaving(false);
    }
  };

  // Themes feature hidden for future use
  // const themes = [
  //   { id: "sunset", name: "Sunset Blush", gradient: "gradient-sunset" },
  //   { id: "ocean", name: "Ocean Breeze", gradient: "gradient-ocean" },
  //   { id: "golden", name: "Golden Hour", gradient: "gradient-golden" },
  //   { id: "emerald", name: "Emerald Fizz", gradient: "gradient-emerald" },
  //   { id: "midnight", name: "Midnight Rose", gradient: "gradient-midnight" },
  // ];

  const pricingPlans = [
    {
      id: "free",
      name: "Free Plan",
      price: 0,
      minGuests: 1,
      maxGuests: 10,
      description: "Perfect for intimate gatherings",
      features: ["Up to 10 guests", "3 days active", "Basic matchmaking"],
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 299,
      minGuests: 11,
      maxGuests: 50,
      description: "For memorable celebrations",
      features: [
        "Up to 100 guests",
        "3 days active after wedding",
        "Full matchmaking",
        "Guest management",
        "Priority support",
      ],
      popular: true,
    },
    {
      id: "vip",
      name: "VIP Plan",
      price: 2999,
      minGuests: 101,
      maxGuests: null,
      description: "Ultimate party experience",
      features: [
        "100+ guests",
        "7 days active after wedding",
        "Full matchmaking",
        "VIP badge for event page",
        "Exclusive VIP themes",
        "Dedicated support",
      ],
    },
  ];

  const handlePayment = () => {
    toast.success("Payment successful! 🎉");
    setShowPaywall(false);
    // Initialize draft immediately after payment
    initializeDraft();
  };

  const generateInviteCode = () => {
    const name1 = eventData.coupleName1.toUpperCase().replace(/\s+/g, "");
    const name2 = eventData.coupleName2.toUpperCase().replace(/\s+/g, "");
    const year = new Date(eventData.eventDate).getFullYear();
    return `${name1}-${name2}-${year}`;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error("Photo must be less than 5MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image");
      return;
    }

    // Create a temporary URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setTempImageFile(file);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!tempImageFile) return;

    setCropDialogOpen(false);

    // Convert blob to file and set as event image
    const file = new File([croppedBlob], tempImageFile.name, { type: croppedBlob.type });
    setEventImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Clean up temp URL
    URL.revokeObjectURL(tempImageUrl);
    setTempImageUrl("");
    setTempImageFile(null);

    toast.success("Photo ready!");
  };

  const handleTakePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleImageChange({ target } as any);
      }
    };
    input.click();
  };

  const handleRemovePhoto = () => {
    setEventImage(null);
    setImagePreview("");
  };

  const handleCreateEvent = async () => {
    if (!userId) return;

    // Validate all required fields
    if (!eventData.coupleName1 || !eventData.coupleName2 || !eventData.eventDate || !eventData.agreedToTerms) {
      toast.error("Please complete all required fields");
      return;
    }

    // Check if we have an image
    if (!eventImage && !imagePreview) {
      toast.error("Please add an event image");
      return;
    }

    setIsCreating(true);
    try {
      const inviteCode = generateInviteCode();
      const eventName = `${eventData.coupleName1} & ${eventData.coupleName2}`;

      let imageUrl = imagePreview; // Use existing preview if editing draft

      // Upload new event image if provided
      if (eventImage) {
        const fileExt = eventImage.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("event-photos").upload(fileName, eventImage);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-photos").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Calculate close date (3 days after event date)
      const eventDate = new Date(eventData.eventDate);
      const closeDate = new Date(eventDate);
      closeDate.setDate(closeDate.getDate() + 3);

      const eventIdToUpdate = editEventId || draftEventId;

      if (eventIdToUpdate) {
        // Update existing draft event
        const { error: updateError } = await supabase
          .from("events")
          .update({
            name: eventName,
            date: eventData.eventDate,
            close_date: closeDate.toISOString().split("T")[0],
            description: `Wedding celebration for ${eventName}`,
            invite_code: inviteCode,
            image_url: imageUrl,
            status: "active",
          })
          .eq("id", eventIdToUpdate)
          .eq("created_by", userId);

        if (updateError) throw updateError;

        toast.success("Event published! 🎊", {
          description: `Share code: ${inviteCode}`,
        });
      } else {
        // Create new event (shouldn't happen with auto-save, but keeping as fallback)
        const { data: event, error: eventError } = await supabase
          .from("events")
          .insert({
            name: eventName,
            date: eventData.eventDate,
            close_date: closeDate.toISOString().split("T")[0],
            description: `Wedding celebration for ${eventName}`,
            invite_code: inviteCode,
            created_by: userId,
            image_url: imageUrl,
            status: "active",
          })
          .select()
          .single();

        if (eventError) throw eventError;

        // Auto-join creator to the event
        const { error: attendeeError } = await supabase.from("event_attendees").insert({
          event_id: event.id,
          user_id: userId,
        });

        if (attendeeError) throw attendeeError;

        toast.success("Event created! 🎊", {
          description: `Share code: ${inviteCode}`,
        });
      }

      navigate("/");
    } catch (error: any) {
      toast.error("Failed to create event", {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const selectedPlanDetails = pricingPlans.find((p) => p.id === eventData.selectedPlan);

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading draft...</p>
      </div>
    );
  }

  if (showPaywall && !isPaid && !editEventId) {
    return (
      <Dialog open={showPaywall} onOpenChange={(open) => !open && navigate("/")}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose Your Event Plan</DialogTitle>
            <DialogDescription>Select a plan based on your expected number of guests</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  eventData.selectedPlan === plan.id ? "ring-2 ring-primary shadow-md" : ""
                } ${plan.popular ? "relative" : ""}`}
                onClick={() => setEventData({ ...eventData, selectedPlan: plan.id })}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-sunset text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.minGuests}-{plan.maxGuests || "unlimited"} guests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`}</p>
                    <p className="text-xs text-muted-foreground">one-time</p>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              className="w-full mt-4 bg-[hsl(345,80%,65%)] hover:bg-[hsl(345,80%,60%)] text-white"
              size="lg"
              onClick={handlePayment}
              disabled={!eventData.selectedPlan}
            >
              {selectedPlanDetails?.price === 0
                ? "Continue with Free Plan"
                : `Purchase ${selectedPlanDetails?.name || "Plan"} - $${selectedPlanDetails?.price.toFixed(2)}`}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-[hsl(var(--title))]">Create Event</h1>
          <p className="text-sm text-subtitle">
            Step {step} of 2 • {selectedPlanDetails?.name || "No plan selected"}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 ? (
          <Card className="p-6 space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="couple1">First Person's Name</Label>
              <Input
                id="couple1"
                placeholder="e.g., Sarah"
                value={eventData.coupleName1}
                onChange={(e) => setEventData({ ...eventData, coupleName1: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couple2">Second Person's Name</Label>
              <Input
                id="couple2"
                placeholder="e.g., James"
                value={eventData.coupleName2}
                onChange={(e) => setEventData({ ...eventData, coupleName2: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <div className="relative">
                <Input
                  id="eventDate"
                  type="date"
                  value={eventData.eventDate}
                  onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-sm text-muted-foreground">
                Matchmaking will remain active for 3 days after your event to allow guests to finish conversations and
                complete their matches.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Event Image *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                A picture of the hosts or logo of the event can be a great option
              </p>
              {imagePreview ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center px-2">Upload Photo</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center px-2">Take Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme selection hidden for future use */}
            {/* <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={eventData.theme}
                onValueChange={(value) =>
                  setEventData({ ...eventData, theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${theme.gradient}`} />
                        {theme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={eventData.agreedToTerms}
                onCheckedChange={(checked) => setEventData({ ...eventData, agreedToTerms: checked as boolean })}
              />
              <Label htmlFor="terms" className="text-sm leading-tight">
                I confirm all guests will be 18+ and agree to the Terms of Service
              </Label>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={() => setStep(2)}
              disabled={
                !eventData.coupleName1 ||
                !eventData.coupleName2 ||
                !eventData.eventDate ||
                !eventData.agreedToTerms ||
                !eventImage
              }
            >
              Next
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">Review Your Event</h2>

            <div className="space-y-4">
              {imagePreview && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Event Image</p>
                  <img src={imagePreview} alt="Event" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Couple</p>
                <p className="font-medium">
                  {eventData.coupleName1} & {eventData.coupleName2}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-medium">{new Date(eventData.eventDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matchmaking Active Until</p>
                <p className="font-medium">
                  {new Date(new Date(eventData.eventDate).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">(3 days after event)</p>
              </div>
              {/* Theme display hidden for future use */}
              {/* <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`h-12 w-full rounded-lg ${
                      themes.find((t) => t.id === eventData.theme)?.gradient
                    }`}
                  />
                </div>
              </div> */}
            </div>

            <Button
              variant="gradient"
              onClick={handleCreateEvent}
              className="w-full"
              disabled={
                isCreating ||
                !eventData.coupleName1 ||
                !eventData.coupleName2 ||
                !eventData.eventDate ||
                !eventData.agreedToTerms ||
                (!eventImage && !imagePreview)
              }
            >
              {isCreating ? "Creating..." : "Create Event"}
            </Button>
          </Card>
        )}
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        imageUrl={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default CreateEvent;
