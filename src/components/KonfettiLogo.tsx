import { useTheme } from "@/contexts/ThemeContext";
import konfettiBlack from "@/assets/konfetti_black.svg";
import konfettiWhite from "@/assets/konfetti_white.svg";

interface KonfettiLogoProps {
  className?: string;
}

export const KonfettiLogo = ({ className = "" }: KonfettiLogoProps) => {
  const { theme } = useTheme();
  
  return (
    <img
      src={theme === "sunset" ? konfettiBlack : konfettiWhite}
      alt="Konfetti Logo"
      className={className}
    />
  );
};
