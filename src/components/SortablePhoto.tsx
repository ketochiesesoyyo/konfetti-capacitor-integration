import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SortablePhotoProps {
  id: string;
  photo: string;
  index: number;
  onDelete: () => void;
}

export const SortablePhoto = ({ id, photo, index, onDelete }: SortablePhotoProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative group"
    >
      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-black/50 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Main Badge */}
      {index === 0 && (
        <Badge className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary">
          Main
        </Badge>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
