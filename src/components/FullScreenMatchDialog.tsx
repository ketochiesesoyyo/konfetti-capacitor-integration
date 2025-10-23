import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, PartyPopper } from "lucide-react";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface FullScreenMatchDialogProps {
  open: boolean;
  matchedProfile: {
    id: string;
    name: string;
    photo_url?: string;
  } | null;
  onStartChat: () => void;
  onKeepMatching: () => void;
}

export function FullScreenMatchDialog({
  open,
  matchedProfile,
  onStartChat,
  onKeepMatching,
}: FullScreenMatchDialogProps) {
  const { t } = useTranslation();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!matchedProfile) return null;

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="max-w-full h-screen w-screen p-0 border-0 bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/90"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Confetti Animation */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94']}
        />

        {/* Content */}
        <div className="flex flex-col items-center justify-center h-full px-6 py-12 relative z-10">
          {/* Match Icon */}
          <div className="mb-8 animate-scale-in">
            <PartyPopper className="w-24 h-24 text-white" strokeWidth={1.5} />
          </div>

          {/* Match Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            {t('matchDialog.title')}
          </h1>

          {/* Match Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 text-center mb-12 max-w-md animate-fade-in">
            {t('matchDialog.subtitle', { name: matchedProfile.name })}
          </p>

          {/* Matched Profile */}
          <div className="mb-12 animate-scale-in">
            <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
              <AvatarImage src={matchedProfile.photo_url} alt={matchedProfile.name} />
              <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                {matchedProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <p className="text-2xl font-semibold text-white text-center mt-4">
              {matchedProfile.name}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              size="lg"
              onClick={onStartChat}
              className="flex-1 text-lg py-6 bg-white text-primary hover:bg-white/90 shadow-2xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('matchDialog.startChatting')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onKeepMatching}
              className="flex-1 text-lg py-6 bg-white/20 text-white border-white/50 hover:bg-white/30 backdrop-blur-sm shadow-xl"
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              {t('matchDialog.keepMatching')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
