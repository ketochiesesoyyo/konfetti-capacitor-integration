import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Matchmaking from "./pages/Matchmaking";
import LikedYou from "./pages/LikedYou";
import Chats from "./pages/Chats";
import ChatThread from "./pages/ChatThread";
import CreateEvent from "./pages/CreateEvent";
import JoinEvent from "./pages/JoinEvent";
import JoinEventByLink from "./pages/JoinEventByLink";
import EventDashboard from "./pages/EventDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/matchmaking" element={<Layout><Matchmaking /></Layout>} />
          <Route path="/liked" element={<Layout><LikedYou /></Layout>} />
          <Route path="/chats" element={<Layout><Chats /></Layout>} />
          <Route path="/chat/:id" element={<ChatThread />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/join-event" element={<JoinEvent />} />
          <Route path="/join/:code" element={<JoinEventByLink />} />
          <Route path="/event-dashboard/:eventId" element={<EventDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
