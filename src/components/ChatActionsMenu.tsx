import { MoreVertical, UserX, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ChatActionsMenuProps = {
  onReportAndUnmatch: () => void;
  onUnmatch: () => void;
};

export const ChatActionsMenu = ({ onReportAndUnmatch, onUnmatch }: ChatActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onReportAndUnmatch();
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report & Unmatch
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onUnmatch();
          }}
          className="cursor-pointer"
        >
          <UserX className="mr-2 h-4 w-4" />
          Unmatch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
