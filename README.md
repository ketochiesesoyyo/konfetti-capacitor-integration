# Konfetti - Event-Based Matchmaking Platform

## Project Overview

**Konfetti** is a premium event-based matchmaking platform that connects singles at weddings and special events through private, secure, and elegant matchmaking experiences. The app enables hosts to create exclusive dating events where attendees can browse profiles, swipe on potential matches, and connect with mutual interests in a curated, event-specific community.

**URL**: https://lovable.dev/projects/0debed18-4033-4f23-be96-138199c4121e

## Key Features

### For Event Hosts
- **Event Creation & Management**: Create private matchmaking events with customizable settings
- **Guest Management**: View attendees, manage intro requests, facilitate matches
- **Premium Plans**: Flexible pricing based on guest count ($299 premium tier)
- **Host Dashboard**: Comprehensive event oversight and controls
- **Invite System**: Unique shareable codes and links for each event

### For Event Attendees
- **Profile System**: Complete profiles with up to 6 photos, custom prompts, interests, and bio
- **Smart Matchmaking**: Swipe-based matching with event-scoped profiles
- **Undo Feature**: 5-second window to undo last swipe action
- **Liked You**: See who's interested and respond instantly
- **Intro Requests**: Request host-facilitated introductions (24-hour eligibility)
- **Real-time Chat**: Message matches with live updates
- **Safety Features**: Report and block users, 18+ age verification

### Platform Features
- **Multi-Event Support**: Attend and host multiple events simultaneously
- **Event Discovery**: Join via invite codes or shareable links
- **Status Management**: Events auto-close after designated date
- **Hide/Show Events**: Organize your event list with hidden events feature
- **Responsive Design**: Optimized for mobile-first experience
- **Theme System**: Elegant sunset and midnight theme options

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn-ui component library
- **Styling**: Tailwind CSS with comprehensive design system
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL database with RLS policies
  - Real-time subscriptions for chat
  - Cloud storage for profile photos
  - Edge functions for payment processing
- **Authentication**: Email/password + Google OAuth
- **Payments**: Stripe integration (checkout + verification)

## Design System - "Bloom-Inspired" Modern Elegance

### Core Design Philosophy
Konfetti embodies a **modern, romantic, and elegant** aesthetic inspired by the Bloom design language, featuring ultra-soft elements, glassmorphism, and gentle animations.

### Visual Identity
- **Brand Name**: Konfetti (playful celebration theme)
- **Primary Colors**: Rich violet/purple palette
  - Primary: `hsl(282, 82%, 49%)` - Bold violet
  - Primary Glow: `hsl(286, 78%, 69%)` - Soft lavender
- **Background**: Pure white (`hsl(0, 0%, 100%)`) for light mode
- **Accent**: Soft peach (`hsl(15, 85%, 80%)`) for warmth

### Design Tokens
- **Border Radius**: Extreme rounded corners (2.5rem) - signature Bloom style
- **Shadows**: Soft, layered shadows with purple tints
  - `shadow-soft`: 0 4px 16px rgba(180, 22, 226, 0.12)
  - `shadow-card`: 0 8px 24px -4px rgba(180, 22, 226, 0.15)
  - `shadow-card-hover`: Enhanced on interaction
- **Gradients**: Smooth purple-to-lavender transitions
  - Header: `135deg` diagonal gradient
  - Primary: Vertical and diagonal options

### UI Components
- **Cards**: Elevated, soft-shadowed containers with extreme rounded corners
- **Buttons**: Gradient backgrounds, smooth hover lifts, active press effects
- **Glassmorphism**: Backdrop blur with semi-transparent backgrounds
- **Typography**: 
  - Title: Dark charcoal with purple undertones
  - Subtitle: Bold violet (brand color)
  - Body: Balanced contrast for readability

### Animation System
- **Entrance Animations**: Staggered fade-slide-blur for content
- **Hover Effects**: Subtle lift and scale (translateY + scale)
- **Press Effects**: Active scale-down for tactile feedback
- **Loading States**: Shimmer animation with gradient sweep
- **Transitions**: Smooth cubic-bezier easing (0.4, 0, 0.2, 1)

### Theme Variants
1. **Sunset Theme (Default)**: Soft violet and peach, pure white background
2. **Midnight Theme**: Dark mode with muted rose accents and soft shadows

### Mobile-First Approach
- Responsive card layouts
- Touch-optimized interactions
- Compact event list with circular images
- Bottom-anchored action buttons
- Collapsible sections for small screens

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0debed18-4033-4f23-be96-138199c4121e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0debed18-4033-4f23-be96-138199c4121e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
