import { useTranslation } from "react-i18next";
import { Shield, UserCheck, Flag, FileText, Eye, Clock, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CommunityGuidelinesDialog } from "@/components/CommunityGuidelinesDialog";

export const SafetyPrivacy = () => {
  const { t } = useTranslation();
  const [showGuidelines, setShowGuidelines] = useState(false);

  const safetyFeatures = [
    {
      icon: UserCheck,
      title: t("landing.safety.feature1.title"),
      description: t("landing.safety.feature1.description"),
    },
    {
      icon: Shield,
      title: t("landing.safety.feature2.title"),
      description: t("landing.safety.feature2.description"),
    },
    {
      icon: Flag,
      title: t("landing.safety.feature3.title"),
      description: t("landing.safety.feature3.description"),
    },
    {
      icon: FileText,
      title: t("landing.safety.feature4.title"),
      description: t("landing.safety.feature4.description"),
    },
    {
      icon: Eye,
      title: t("landing.safety.feature5.title"),
      description: t("landing.safety.feature5.description"),
    },
    {
      icon: Clock,
      title: t("landing.safety.feature6.title"),
      description: t("landing.safety.feature6.description"),
    },
    {
      icon: Lock,
      title: t("landing.safety.feature7.title"),
      description: t("landing.safety.feature7.description"),
    },
    {
      icon: CheckCircle,
      title: t("landing.safety.feature8.title"),
      description: t("landing.safety.feature8.description"),
    },
  ];

  return (
    <>
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t("landing.safety.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.safety.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {safetyFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300 space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowGuidelines(true)}
              className="min-w-[200px]"
            >
              {t("landing.safety.viewGuidelines")}
            </Button>
          </div>
        </div>
      </section>

      <CommunityGuidelinesDialog
        open={showGuidelines}
        onOpenChange={setShowGuidelines}
      />
    </>
  );
};
