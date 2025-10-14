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
}

export const ImageCropDialog = ({
  open,
  imageUrl,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) => {
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

      // Set canvas size to the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, "image/jpeg", 0.9);
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
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
          />
          {/* Circular preview guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border-4 border-white shadow-lg opacity-50"></div>
          </div>
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
