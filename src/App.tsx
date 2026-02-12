import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Layout from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./i18n/config";
import { isAdminDomainAllowed, isAdminSubdomain } from "./lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "./hooks/use-push-notifications";

// Lazy load all page components for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
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
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));

// Admin components (lazy loaded)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminContent = lazy(() => import("./components/admin/AdminContent").then(m => ({ default: m.AdminContent })));
const AdminEventDashboard = lazy(() => import("./pages/AdminEventDashboard"));
const AdminClientDetail = lazy(() => import("./pages/AdminClientDetail"));
const AdminCompanyDetail = lazy(() => import("./pages/AdminCompanyDetail"));

// Portal components (lazy loaded)
const PortalLayout = lazy(() => import("./components/portal/PortalLayout").then(m => ({ default: m.PortalLayout })));
const PortalAuth = lazy(() => import("./pages/PortalAuth"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalEventDetail = lazy(() => import("./pages/portal/PortalEventDetail"));
const PortalNewRequest = lazy(() => import("./pages/portal/PortalNewRequest"));

const showAdminRoute = isAdminDomainAllowed();

const queryClient = new QueryClient();

// Global listener for password recovery events - redirects to /reset-password from any page
const PasswordRecoveryHandler = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Navigate to reset-password page when recovery token is detected
        window.location.href = '/reset-password';
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return <>{children}</>;
};

// Redirect component that checks auth state and routes accordingly
const IndexRedirect = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const adminSubdomain = isAdminSubdomain();

  useEffect(() => {
    if (adminSubdomain) return; // Skip auth check on admin subdomain
    const checkAuth = async () => {
      // If URL hash contains recovery tokens, redirect to reset-password immediately
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        window.location.href = '/reset-password' + hash;
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsChecking(false);
    };
    checkAuth();
  }, [adminSubdomain]);

  // On admin subdomain, always redirect to /admin (AdminLayout handles auth)
  if (adminSubdomain) {
    return <Navigate to="/admin" replace />;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/profile" replace /> : <Navigate to="/landing" replace />;
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
        <PasswordRecoveryHandler>
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
              {/* Apple App Store required redirects */}
              <Route path="/help" element={<Navigate to="/support" replace />} />
              <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
              <Route path="/terms" element={<Navigate to="/terms-conditions" replace />} />
              <Route path="/support" element={<Support />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
              {showAdminRoute && (
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminContent activeTab="dashboard" />} />
                  <Route path="leads" element={<AdminContent activeTab="leads" />} />
                  <Route path="clients" element={<AdminContent activeTab="clients" />} />
                  <Route path="companies" element={<AdminContent activeTab="companies" />} />
                  <Route path="events" element={<AdminContent activeTab="events" />} />
                  <Route path="users" element={<AdminContent activeTab="users" />} />
                  <Route path="revenue" element={<AdminContent activeTab="revenue" />} />
                  <Route path="finance" element={<AdminContent activeTab="finance" />} />
                  <Route path="analytics" element={<AdminContent activeTab="analytics" />} />
                  <Route path="event/:eventId" element={<AdminEventDashboard />} />
                  <Route path="client/:id" element={<AdminClientDetail />} />
                  <Route path="company/:id" element={<AdminCompanyDetail />} />
                </Route>
              )}
              {/* Client Portal */}
              <Route path="/portal/login" element={<PortalAuth />} />
              <Route path="/portal/register" element={<PortalAuth />} />
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalDashboard />} />
                <Route path="event/:eventId" element={<PortalEventDetail />} />
                <Route path="request" element={<PortalNewRequest />} />
              </Route>
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </PushNotificationHandler>
        </PasswordRecoveryHandler>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
