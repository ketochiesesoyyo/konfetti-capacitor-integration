import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Layout from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./i18n/config";
import { isAdminDomainAllowed } from "./lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "./hooks/use-push-notifications";

// Lazy load all page components for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Landing = lazy(() => import("./pages/Landing"));
const ForCouples = lazy(() => import("./pages/ForCouples"));
const WeddingPlanners = lazy(() => import("./pages/WeddingPlanners"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const Matchmaking = lazy(() => import("./pages/Matchmaking"));
const LikedYou = lazy(() => import("./pages/LikedYou"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatThread = lazy(() => import("./pages/ChatThread"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const JoinEvent = lazy(() => import("./pages/JoinEvent"));
const JoinEventByLink = lazy(() => import("./pages/JoinEventByLink"));
const EventDashboard = lazy(() => import("./pages/EventDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));

const showAdminRoute = isAdminDomainAllowed();

const queryClient = new QueryClient();

// Redirect component that checks auth state and routes accordingly
const IndexRedirect = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/profile" replace /> : <Navigate to="/auth" replace />;
};

// Component to initialize push notifications
const PushNotificationHandler = ({ children }: { children: React.ReactNode }) => {
  usePushNotifications();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PushNotificationHandler>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
              <Route path="/" element={<IndexRedirect />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/para-novios" element={<ForCouples />} />
              <Route path="/wedding-planners" element={<WeddingPlanners />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Layout><Home /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/matchmaking/:eventId" element={<Layout><Matchmaking /></Layout>} />
              <Route path="/matchmaking" element={<Layout><Matchmaking /></Layout>} />
              <Route path="/liked" element={<Layout><LikedYou /></Layout>} />
              <Route path="/chats" element={<Layout><Chats /></Layout>} />
              <Route path="/chat/:id" element={<ChatThread />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/join-event" element={<JoinEvent />} />
              <Route path="/join/:code" element={<JoinEventByLink />} />
              <Route path="/event-dashboard/:eventId" element={<EventDashboard />} />
              {showAdminRoute && <Route path="/admin" element={<Admin />} />}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </PushNotificationHandler>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
