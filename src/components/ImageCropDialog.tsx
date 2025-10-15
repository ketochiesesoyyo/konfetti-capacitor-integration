import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  type?: "profile" | "event"; // Profile: 3:4 ratio, Event: 1:1 ratio
}

export const ImageCropDialog = ({
  open,
  imageUrl,
  onClose,
  onCropComplete,
  type = "event",
}: ImageCropDialogProps) => {
  const isProfilePhoto = type === "profile";
  const aspectRatio = isProfilePhoto ? 3 / 4 : 1;
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPx: Area) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;
    
    setProcessing(true);
    try {
      const image = await createImage(imageUrl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Calculate target dimensions to fit ~1MB constraint
      // Aim for ~1200px on longest side for good quality at ~1MB
      const maxDimension = 1200;
      let targetWidth = croppedAreaPixels.width;
      let targetHeight = croppedAreaPixels.height;
      
      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      // Set canvas to target size (resizing for compression)
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the cropped and resized image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Try to compress to ~1MB with dynamic quality adjustment
      const tryCompress = async (quality: number): Promise<Blob | null> => {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
        });
      };

      let quality = 0.85;
      let blob = await tryCompress(quality);
      const targetSize = 1 * 1024 * 1024; // 1MB

      // Adjust quality if needed to hit ~1MB target
      if (blob && blob.size > targetSize * 1.5) {
        quality = 0.75;
        blob = await tryCompress(quality);
      }
      if (blob && blob.size > targetSize * 2) {
        quality = 0.65;
        blob = await tryCompress(quality);
      }

      if (blob) {
        onCropComplete(blob);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Your Photo</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            cropShape={isProfilePhoto ? "rect" : "round"}
            showGrid={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={createCroppedImage} disabled={processing}>
            {processing ? "Processing..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
