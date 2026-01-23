import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ArrowLeft, Check, Camera, X, Info as InfoIcon } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { toast } from "sonner";
import { eventSchema } from "@/lib/validation";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { handleError, getErrorMessage } from "@/lib/errorHandling";

const CreateEvent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useState<NodeJS.Timeout | null>(null);
  
  
  const [matchmakingOption, setMatchmakingOption] = useState<string>("1_week_before");
  
  // Helper function to determine matchmaking option from dates
  const determineMatchmakingOption = (eventDate: string, startDate: string | null): string => {
    if (!startDate || startDate === "") return "immediately";
    
    const event = new Date(eventDate);
    const start = new Date(startDate);
    const daysDiff = Math.round((event.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return "day_of_event";
    if (daysDiff === 7) return "1_week_before";
    if (daysDiff === 14) return "2_weeks_before";
    return "immediately";
  };
  
  const [eventData, setEventData] = useState({
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
    matchmakingStartDate: "",
    matchmakingStartTime: "00:00",
    theme: "sunset",
    agreedToTerms: false,
    
    expectedGuests: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUserId(session.user.id);
      
      // Check if user has admin role
      const { data: hasAdminRole } = await supabase
        .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
      
      if (!hasAdminRole) {
        toast.error("Access denied. Only administrators can create events.");
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      
      // Load draft if editing
      if (editEventId) {
        await loadDraftEvent(editEventId, session.user.id);
      } else {
        // Check for existing auto-saved draft
        await loadExistingDraft(session.user.id);
      }
    };
    checkAuth();
  }, [navigate, editEventId]);

  // Auto-save effect
  useEffect(() => {
    if (!userId || loadingDraft) return;

    // Skip if editing existing event
    if (editEventId) return;

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
  }, [eventData, imagePreview, userId, loadingDraft]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Trigger immediate save on unload if we have a draft started
      if (userId && !loadingDraft && draftEventId) {
        autoSaveDraft(true); // Pass true for synchronous save
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
        const loadedEventData = {
          coupleName1: nameParts[0] === "Draft Event" ? "" : nameParts[0] || "",
          coupleName2: nameParts[1] || "",
          eventDate: draft.date || "",
          matchmakingStartDate: draft.matchmaking_start_date || "",
          matchmakingStartTime: draft.matchmaking_start_time || "00:00",
          theme: "sunset",
          agreedToTerms: true,
          
          expectedGuests: 0,
        };
        
        setEventData(loadedEventData);
        
        // Determine and set the matchmaking option
        if (draft.date) {
          const option = determineMatchmakingOption(draft.date, draft.matchmaking_start_date);
          setMatchmakingOption(option);
        }

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
        const loadedEventData = {
          coupleName1: nameParts[0] === "Draft Event" ? "" : nameParts[0] || "",
          coupleName2: nameParts[1] || "",
          eventDate: event.date || "",
          matchmakingStartDate: event.matchmaking_start_date || "",
          matchmakingStartTime: event.matchmaking_start_time || "00:00",
          theme: "sunset",
          agreedToTerms: true,
          
          expectedGuests: 0,
        };
        
        setEventData(loadedEventData);
        
        // Determine and set the matchmaking option
        if (event.date) {
          const option = determineMatchmakingOption(event.date, event.matchmaking_start_date);
          setMatchmakingOption(option);
        }

        // Set image preview if exists
        if (event.image_url) {
          setImagePreview(event.image_url);
        }
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
          name: 'Draft Event',
          date: null,
          close_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Wedding celebration',
          invite_code: `DRAFT-${Date.now()}`,
          created_by: userId,
          image_url: null,
          status: 'draft',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      setDraftEventId(event.id);

      // Auto-join creator to the event
      await supabase
        .from("event_attendees")
        .insert({
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
      if (eventImage && !imagePreview.startsWith('http')) {
        try {
          const fileExt = eventImage.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/draft_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('event-photos')
            .upload(fileName, eventImage, {
              cacheControl: '3600',
              upsert: false,
              contentType: eventImage.type || 'image/jpeg'
            });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('event-photos')
              .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
          } else {
            console.error("Auto-save image upload error:", uploadError);
            // Continue without image - don't fail the whole auto-save
          }
        } catch (imageError) {
          console.error("Auto-save image error:", imageError);
          // Continue without image
        }
      }
      
      const inviteCode = eventData.coupleName1 && eventData.coupleName2 && eventData.eventDate 
        ? generateInviteCode() 
        : `DRAFT-${Date.now()}`;
      
      const eventName = eventData.coupleName1 && eventData.coupleName2
        ? `${eventData.coupleName1} & ${eventData.coupleName2}`
        : 'Draft Event';
      
      const closeDate = eventData.eventDate 
        ? new Date(new Date(eventData.eventDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
            matchmaking_start_date: eventData.matchmakingStartDate || null,
            matchmaking_start_time: eventData.matchmakingStartTime || null,
          })
          .eq("id", draftEventId)
          .eq("created_by", userId);

        if (updateError) {
          console.error("Error updating draft:", updateError);
          // Don't throw - allow silent failure for auto-save
        }
      } else {
        // Create new draft (should happen via initializeDraft now, but keeping as fallback)
        await initializeDraft();
      }
      
      if (!synchronous) {
        console.log("Auto-saved draft");
      }
    } catch (error: any) {
      console.error("Error auto-saving draft:", error);
      // Silent failure for auto-save - don't disturb user experience
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
  const generateInviteCode = () => {
    const name1 = eventData.coupleName1.toUpperCase().replace(/\s+/g, '');
    const name2 = eventData.coupleName2.toUpperCase().replace(/\s+/g, '');
    const year = new Date(eventData.eventDate).getFullYear();
    
    // Generate 4 random alphanumeric characters (A-Z, 0-9)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomChars = '';
    for (let i = 0; i < 4; i++) {
      randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${name1.substring(0, 3)}${name2.substring(0, 3)}${year}${randomChars}`;
  };

  if (loadingDraft || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // Create a temporary URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setTempImageFile(file);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      if (!tempImageFile) {
        throw new Error("No image file selected");
      }

      // Validate blob
      if (!croppedBlob || croppedBlob.size === 0) {
        throw new Error("Invalid cropped image");
      }

      // Validate size (5MB)
      if (croppedBlob.size > 5242880) {
        throw new Error("Cropped image is too large (max 5MB)");
      }

      setCropDialogOpen(false);
      
      // Convert blob to file with proper type detection for iOS
      const mimeType = croppedBlob.type || 'image/jpeg';
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `event_${Date.now()}.${fileExtension}`;
      
      const file = new File([croppedBlob], fileName, { type: mimeType });
      
      // Validate the file was created successfully
      if (!file || file.size === 0) {
        throw new Error("Failed to process image");
      }
      
      setEventImage(file);
      
      // Create preview with error handling
      const reader = new FileReader();
      reader.onerror = () => {
        throw new Error("Failed to read image file");
      };
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
          toast.success("Photo ready!");
        } else {
          handleError(new Error("Failed to create preview"), "Failed to process image", "handleCropComplete");
        }
      };
      reader.readAsDataURL(file);
      
      // Clean up temp URL
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl("");
      setTempImageFile(null);
      
    } catch (error: any) {
      handleError(error, "Failed to process image. Please try again.", "handleCropComplete");
      setCropDialogOpen(false);
      // Clean up
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
      }
      setTempImageUrl("");
      setTempImageFile(null);
    }
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
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
    if (!userId) {
      handleError(new Error("No user session"), "Please log in to create an event", "handleCreateEvent");
      navigate("/auth");
      return;
    }
    
    // PRE-FLIGHT VALIDATION - Check all required fields before starting
    const validationErrors: string[] = [];
    
    if (!eventData.coupleName1?.trim()) validationErrors.push("First person's name is required");
    if (!eventData.coupleName2?.trim()) validationErrors.push("Second person's name is required");
    if (!eventData.eventDate) validationErrors.push("Event date is required");
    if (!eventData.agreedToTerms) validationErrors.push("You must agree to the terms");
    if (!eventImage && !imagePreview) validationErrors.push("Event image is required");
    
    // Show all validation errors at once
    if (validationErrors.length > 0) {
      toast.error("Please complete all required fields", {
        description: validationErrors[0],
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const inviteCode = generateInviteCode();
      const eventName = `${eventData.coupleName1.trim()} & ${eventData.coupleName2.trim()}`;
      
      let imageUrl = imagePreview; // Use existing preview if editing draft
      
      // Upload new event image if provided - with iOS-specific handling
      if (eventImage) {
        try {
          // Validate image before upload
          if (eventImage.size === 0) {
            throw new Error("Image file is empty");
          }
          
          if (eventImage.size > 5242880) {
            throw new Error("Image must be less than 5MB");
          }
          
          const fileExt = eventImage.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/${Date.now()}.${fileExt}`;
          
          console.log(`Uploading image: ${fileName}, size: ${eventImage.size} bytes, type: ${eventImage.type}`);
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('event-photos')
            .upload(fileName, eventImage, {
              cacheControl: '3600',
              upsert: false,
              contentType: eventImage.type || 'image/jpeg'
            });
          
          if (uploadError) {
            console.error("Image upload error:", uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
          
          if (!uploadData) {
            throw new Error("Image upload succeeded but no data returned");
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('event-photos')
            .getPublicUrl(fileName);
          
          if (!publicUrl) {
            throw new Error("Failed to get image URL");
          }
          
          imageUrl = publicUrl;
          console.log("Image uploaded successfully:", imageUrl);
        } catch (imageError: any) {
          // Image upload failed - show specific error and stop
          handleError(
            imageError, 
            "Failed to upload event image. Please try again or choose a different image.", 
            "handleCreateEvent-imageUpload"
          );
          setIsCreating(false);
          return;
        }
      }
      
      // Validate we have an image URL at this point
      if (!imageUrl) {
        throw new Error("No image available for event");
      }
      
      // Calculate close date (3 days after event date)
      const eventDate = new Date(eventData.eventDate);
      const closeDate = new Date(eventDate);
      closeDate.setDate(closeDate.getDate() + 3);
      
      const eventIdToUpdate = editEventId || draftEventId;
      
      let createdEventId = eventIdToUpdate;
      
      if (eventIdToUpdate) {
        // Update existing draft event - ONLY set to active after successful completion
        try {
          const { error: updateError } = await supabase
            .from("events")
            .update({
              name: eventName,
              date: eventData.eventDate,
              close_date: closeDate.toISOString().split('T')[0],
              description: `Wedding celebration for ${eventName}`,
              invite_code: inviteCode,
              image_url: imageUrl,
              status: 'active',
              matchmaking_start_date: eventData.matchmakingStartDate || null,
              matchmaking_start_time: eventData.matchmakingStartTime || null,
              matchmaking_close_date: null,
            })
            .eq("id", eventIdToUpdate)
            .eq("created_by", userId);

          if (updateError) {
            throw new Error(`Failed to update event: ${updateError.message}`);
          }


          // Clear draft ID only after successful creation
          setDraftEventId(null);

          toast.success("Event published! 🎊", {
            description: `Share code: ${inviteCode}`,
          });
        } catch (dbError: any) {
          handleError(
            dbError,
            "Failed to save event. Your draft has been saved.",
            "handleCreateEvent-updateDraft"
          );
          setIsCreating(false);
          return;
        }
      } else {
        // Validate event data before creating
        const validationResult = eventSchema.safeParse({
          name: eventName,
          description: `Wedding celebration for ${eventName}`,
          date: eventData.eventDate,
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast.error(firstError.message);
          setIsCreating(false);
          return;
        }

        const validated = validationResult.data;

        // Create new event (shouldn't happen with auto-save, but keeping as fallback)
        try {
          const { data: event, error: eventError } = await supabase
            .from("events")
            .insert({
              name: validated.name,
              date: validated.date,
              close_date: closeDate.toISOString().split('T')[0],
              description: validated.description,
              invite_code: inviteCode,
              created_by: userId,
              image_url: imageUrl,
              status: 'active',
              matchmaking_start_date: eventData.matchmakingStartDate || null,
              matchmaking_start_time: eventData.matchmakingStartTime || null,
            })
            .select()
            .single();

          if (eventError) {
            throw new Error(`Failed to create event: ${eventError.message}`);
          }
          
          if (!event) {
            throw new Error("Event created but no data returned");
          }
          
          createdEventId = event.id;
          
          // Auto-join creator to the event
          const { error: attendeeError } = await supabase
            .from("event_attendees")
            .insert({
              event_id: event.id,
              user_id: userId,
            });
            
          if (attendeeError) {
            console.error("Failed to auto-join creator:", attendeeError);
            // Don't fail the whole operation for this
          }
          

          toast.success(t("createEvent.eventCreated"), {
            description: t("createEvent.shareCode"),
          });
        } catch (dbError: any) {
          handleError(
            dbError,
            "Failed to create event. Please try again.",
            "handleCreateEvent-createNew"
          );
          setIsCreating(false);
          return;
        }
      }
      
      // Redirect to event dashboard, not home
      navigate(`/event-dashboard/${createdEventId}`);
    } catch (error: any) {
      // Catch-all for any unexpected errors
      handleError(
        error,
        getErrorMessage(error, "Failed to create event. Your progress has been saved as a draft."),
        "handleCreateEvent"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading draft...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  navigate("/");
                }
              }}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[hsl(var(--title))]">Create Event</h1>
            </div>
          </div>
          <p className="text-sm text-subtitle">
            Step {step} of 3
          </p>
        </div>
      </div>


      <div className="max-w-lg mx-auto px-4 py-6">
        {!editEventId && step === 1 && (
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>{t('createEvent.hostMatchmakingInfo.title')}</AlertTitle>
            <AlertDescription>
              {t('createEvent.hostMatchmakingInfo.description')}
            </AlertDescription>
          </Alert>
        )}
        
        {step === 1 ? (
          <Card className="p-6 space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="couple1">First Person's Name</Label>
              <Input
                id="couple1"
                placeholder="e.g., Sarah"
                value={eventData.coupleName1}
                onChange={(e) =>
                  setEventData({ ...eventData, coupleName1: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couple2">Second Person's Name</Label>
              <Input
                id="couple2"
                placeholder="e.g., James"
                value={eventData.coupleName2}
                onChange={(e) =>
                  setEventData({ ...eventData, coupleName2: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <div className="relative">
                <Input
                  id="eventDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={eventData.eventDate}
                  onChange={(e) =>
                    setEventData({ ...eventData, eventDate: e.target.value })
                  }
                />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <Label className="text-base font-semibold">{t('createEvent.matchmakingSchedule')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('createEvent.matchmakingScheduleDesc')}
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="matchmakingSchedule">{t('createEvent.matchmakingScheduleWhen')}</Label>
                <Select
                  value={matchmakingOption}
                  onValueChange={(value) => {
                    setMatchmakingOption(value);
                    let calculatedDate = "";
                    let calculatedTime = "00:00";
                    
                    if (value === "immediately") {
                      // Set to current date and time if immediately
                      calculatedDate = "";
                      calculatedTime = "00:00";
                    } else if (eventData.eventDate) {
                      const eventDate = new Date(eventData.eventDate);
                      if (value === "1_week_before") {
                        const startDate = new Date(eventDate);
                        startDate.setDate(startDate.getDate() - 7);
                        calculatedDate = startDate.toISOString().split('T')[0];
                      } else if (value === "2_weeks_before") {
                        const startDate = new Date(eventDate);
                        startDate.setDate(startDate.getDate() - 14);
                        calculatedDate = startDate.toISOString().split('T')[0];
                      } else if (value === "day_of_event") {
                        calculatedDate = eventData.eventDate;
                      }
                    }
                    
                    setEventData({ 
                      ...eventData, 
                      matchmakingStartDate: calculatedDate,
                      matchmakingStartTime: calculatedTime
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('createEvent.matchmakingImmediately')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="immediately">{t('createEvent.matchmakingImmediately')}</SelectItem>
                    <SelectItem value="day_of_event">{t('createEvent.matchmakingDayOf')}</SelectItem>
                    <SelectItem value="1_week_before">{t('createEvent.matchmaking1WeekBefore')}</SelectItem>
                    <SelectItem value="2_weeks_before">{t('createEvent.matchmaking2WeeksBefore')}</SelectItem>
                  </SelectContent>
                </Select>
                {matchmakingOption !== "immediately" && eventData.matchmakingStartDate && (
                  <p className="text-xs text-primary font-medium">
                    Will open on {format(new Date(eventData.matchmakingStartDate), 'dd / MMM / yyyy')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {t('createEvent.matchmakingRecommendation')}
                </p>
              </div>

              <div className="space-y-2">
                {eventData.matchmakingStartDate && eventData.eventDate && (
                  <div className="rounded-lg bg-primary/10 p-4 border border-primary/30 mb-3">
                    <p className="text-sm font-medium mb-1 text-primary">Matchmaking Opens</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(eventData.matchmakingStartDate), 'dd / MMM / yyyy')} at {eventData.matchmakingStartTime || '00:00'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      All guests and the host will be notified about the matchmaking page opening.
                    </p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                  <p className="text-sm font-medium mb-1">Close Date</p>
                  <p className="text-sm text-muted-foreground">
                    Matchmaking automatically closes 3 days after the wedding date{eventData.eventDate && ` (${format(new Date(new Date(eventData.eventDate).getTime() + 3 * 24 * 60 * 60 * 1000), 'dd / MMM / yyyy')})`}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Chats remain active after matchmaking closes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Image *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                A picture of the hosts or logo of the event can be a great option
              </p>
              {imagePreview ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
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


            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={() => setStep(2)}
              disabled={
                !eventData.coupleName1 ||
                !eventData.coupleName2 ||
                !eventData.eventDate ||
                (!eventImage && !imagePreview)
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
                  <img
                    src={imagePreview}
                    alt="Event"
                    className="w-48 h-48 object-cover rounded-full mx-auto"
                  />
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
                <p className="font-medium">
                  {format(new Date(eventData.eventDate), 'dd / MMM / yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matchmaking Active Until</p>
                <p className="font-medium">
                  {format(new Date(new Date(eventData.eventDate).getTime() + 3 * 24 * 60 * 60 * 1000), 'dd / MMM / yyyy')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (3 days after event)
                </p>
              </div>
              {eventData.matchmakingStartDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Matchmaking Starts</p>
                  <p className="font-medium">
                    {format(new Date(eventData.matchmakingStartDate), 'dd / MMM / yyyy')} at 00:00 UK Time
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={eventData.agreedToTerms}
                onCheckedChange={(checked) =>
                  setEventData({ ...eventData, agreedToTerms: checked as boolean })
                }
              />
              <Label htmlFor="terms" className="text-sm leading-tight">
                I confirm all guests will be 18+ and agree to the Terms of Service
              </Label>
            </div>

            <Button
              variant="gradient"
              onClick={handleCreateEvent}
              className="w-full"
              size="lg"
              disabled={!eventData.agreedToTerms || isCreating}
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
