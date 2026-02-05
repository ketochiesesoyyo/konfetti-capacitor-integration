import { MoreVertical, UserX, AlertTriangle, ShieldOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type ChatActionsMenuProps = {
  onReportAndUnmatch: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
};

export const ChatActionsMenu = ({ onReportAndUnmatch, onUnmatch, onBlock }: ChatActionsMenuProps) => {
  const { t } = useTranslation();
  
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
            onUnmatch();
          }}
          className="cursor-pointer"
        >
          <UserX className="mr-2 h-4 w-4" />
          {t('chats.unmatch')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onBlock();
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <ShieldOff className="mr-2 h-4 w-4" />
          {t('chats.blockUser')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onReportAndUnmatch();
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {t('chats.reportAndUnmatch')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
