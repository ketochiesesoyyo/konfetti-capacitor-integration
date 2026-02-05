import SwiftUI
import Combine

/// Main matchmaking view with swipe cards - matches React/Capacitor version
struct MatchmakingView: View {
    var preselectedEventId: String?

    @StateObject private var viewModel = MatchmakingViewModel()
    @EnvironmentObject var authState: AuthState
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dataStore: DataStore

    @State private var showEventSelector = false
    @State private var showUndo = false
    @State private var undoWorkItem: DispatchWorkItem?

    // Timer for countdown updates (no API calls - purely local)
    @State private var countdownTick = Date()

    /// Selected event from DataStore
    private var selectedEvent: Event? {
        dataStore.events.first { $0.id == viewModel.selectedEventId }
    }

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Header
                headerView

                // Main content
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Loading profiles...")
                    Spacer()
                } else if viewModel.profiles.isEmpty {
                    emptyStateView
                } else {
                    // Profile card (scrollable)
                    profileCardView
                }
            }

            // Floating Undo Button (appears temporarily after swipe)
            if showUndo && viewModel.canUndo {
                VStack {
                    undoButton
                        .padding(.top, 100)
                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Action Buttons (fixed at bottom, 40pts above tab bar)
            if !viewModel.profiles.isEmpty && !viewModel.isLoading {
                VStack {
                    Spacer()
                    actionButtons
                        .padding(.bottom, 40)
                }
            }
        }
        .background(Color(.systemBackground))
        .navigationBarHidden(true)
        .sheet(isPresented: $showEventSelector) {
            EventSelectorSheet(
                events: dataStore.events,
                selectedEventId: viewModel.selectedEventId,
                onSelect: { eventId in
                    viewModel.selectedEventId = eventId
                    showEventSelector = false
                    Task {
                        await viewModel.loadProfiles()
                    }
                }
            )
        }
        .fullScreenCover(isPresented: $appState.showMatchCelebration) {
            if let match = appState.celebratingMatch, let profile = appState.matchedProfile {
                MatchCelebrationView(match: match, matchedProfile: profile)
            }
        }
        .onChange(of: appState.showMatchCelebration) { _, isShowing in
            if isShowing, let match = appState.celebratingMatch, let profile = appState.matchedProfile {
                // Add match to DataStore so it appears in Chats immediately
                let eventName = selectedEvent?.name ?? "Event"
                dataStore.addMatch(match, profile: profile, eventName: eventName)
            }
        }
        .task {
            if let userId = authState.currentUserId {
                viewModel.userId = userId
                viewModel.appState = appState

                // Load events from DataStore if not already loaded
                await dataStore.loadEvents()

                // Set selected event (priority: preselectedEventId > appState.selectedEventId > auto-select)
                if let preselectedEventId = preselectedEventId {
                    viewModel.selectedEventId = preselectedEventId
                } else if let appStateEventId = appState.selectedEventId {
                    // Event selected from Events tab navigation
                    viewModel.selectedEventId = appStateEventId
                    appState.selectedEventId = nil  // Clear after using
                } else if viewModel.selectedEventId == nil {
                    // Auto-select: prioritize live events, then upcoming (never closed)
                    if let liveEvent = dataStore.liveEvents.first {
                        viewModel.selectedEventId = liveEvent.id
                    } else if let upcomingEvent = dataStore.upcomingEvents.first {
                        viewModel.selectedEventId = upcomingEvent.id
                    }
                }

                await viewModel.loadProfiles()
            }
        }
        // Timer for live countdown (updates every second, no API calls)
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { time in
            // Only update if showing countdown (upcoming event selected)
            if let event = selectedEvent,
               let countdown = event.matchmakingStartsIn,
               countdown > 0 {
                countdownTick = time
            }
        }
        // Handle navigation from Events tab
        .onChange(of: appState.selectedEventId) { _, newEventId in
            if let eventId = newEventId {
                viewModel.selectedEventId = eventId
                appState.selectedEventId = nil  // Clear after using
                Task {
                    await viewModel.loadProfiles()
                }
            }
        }
    }

    // MARK: - Header

    private var headerView: some View {
        VStack(spacing: 8) {
            HStack {
                // Menu button
                Button(action: { showEventSelector = true }) {
                    Image(systemName: "line.3.horizontal")
                        .font(.title2)
                        .foregroundColor(.primary)
                }

                Spacer()

                // Logo
                Image("KonfettiLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 28)

                Spacer()

                // Placeholder for symmetry
                Image(systemName: "line.3.horizontal")
                    .font(.title2)
                    .foregroundColor(.clear)
            }
            .padding(.horizontal, 16)

            // Event name
            if let event = selectedEvent {
                Text(event.name)
                    .font(.headline)
                    .fontWeight(.bold)
            }
        }
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }

    // MARK: - Profile Card (Scrollable)

    private var profileCardView: some View {
        GeometryReader { geometry in
            if let profile = viewModel.currentProfile {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Main photo with overlay
                        ZStack(alignment: .bottomLeading) {
                            if let firstPhoto = profile.photos?.first, let url = URL(string: firstPhoto) {
                                AsyncImage(url: url) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    case .failure, .empty:
                                        photoPlaceholder
                                    @unknown default:
                                        photoPlaceholder
                                    }
                                }
                            } else {
                                photoPlaceholder
                            }

                            // Gradient overlay
                            LinearGradient(
                                colors: [.clear, .black.opacity(0.7)],
                                startPoint: .center,
                                endPoint: .bottom
                            )

                            // Name and info
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(alignment: .firstTextBaseline, spacing: 8) {
                                    Text(profile.name)
                                        .font(.largeTitle)
                                        .fontWeight(.bold)
                                    if let age = profile.age {
                                        Text("\(age)")
                                            .font(.title)
                                    }
                                }

                                if let instagram = profile.instagramUsername, !instagram.isEmpty {
                                    Text("@\(instagram)")
                                        .font(.subheadline)
                                        .opacity(0.9)
                                }
                            }
                            .foregroundColor(.white)
                            .padding(24)
                        }
                        .frame(height: 450)
                        .clipped()

                        // Content
                        VStack(spacing: 20) {
                            // Bio
                            if let bio = profile.bio, !bio.isEmpty {
                                ProfileContentCard(title: "About") {
                                    Text(bio)
                                        .foregroundColor(.primary)
                                }
                            }

                            // Second photo
                            if let photos = profile.photos, photos.count > 1 {
                                profilePhoto(photos[1])
                            }

                            // Prompts
                            if let prompts = profile.prompts {
                                ForEach(Array(prompts.enumerated()), id: \.offset) { index, prompt in
                                    ProfileContentCard(title: prompt.question) {
                                        Text(prompt.answer)
                                            .foregroundColor(.primary)
                                    }

                                    // Third photo after first prompt
                                    if index == 0, let photos = profile.photos, photos.count > 2 {
                                        profilePhoto(photos[2])
                                    }
                                }
                            }

                            // Interests
                            if let interests = profile.interests, !interests.isEmpty {
                                ProfileContentCard(title: "Interests") {
                                    FlowLayout(spacing: 8) {
                                        ForEach(interests, id: \.self) { interest in
                                            Text(interest)
                                                .font(.subheadline)
                                                .padding(.horizontal, 14)
                                                .padding(.vertical, 8)
                                                .background(Color.secondary.opacity(0.15))
                                                .cornerRadius(20)
                                        }
                                    }
                                }
                            }

                            // Remaining photos
                            if let photos = profile.photos, photos.count > 3 {
                                ForEach(Array(photos.dropFirst(3).enumerated()), id: \.offset) { _, photo in
                                    profilePhoto(photo)
                                }
                            }

                            Spacer(minLength: 160)
                        }
                        .padding(20)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 32))
                .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 10)
                .padding(.horizontal, 12)
                .padding(.top, 8)
            }
        }
    }

    @ViewBuilder
    private func profilePhoto(_ urlString: String) -> some View {
        if let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                if case .success(let image) = phase {
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 400)
                        .clipped()
                        .cornerRadius(24)
                }
            }
        }
    }

    private var photoPlaceholder: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [Color.primaryPink.opacity(0.6), Color.primaryPurple.opacity(0.6)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .overlay(
                Image(systemName: "person.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.white.opacity(0.6))
            )
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 32) {
            // Pass button (X)
            Button(action: {
                Task {
                    await viewModel.swipeLeft()
                    showUndoTemporarily()
                }
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Color(.systemGray))
                    .frame(width: 64, height: 64)
                    .background(Color(.systemBackground))
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color(.systemGray3), lineWidth: 2)
                    )
                    .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
            }

            // Like button (Heart)
            Button(action: {
                Task {
                    await viewModel.swipeRight()
                    showUndoTemporarily()
                }
            }) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 32))
                    .foregroundColor(.white)
                    .frame(width: 80, height: 80)
                    .background(
                        LinearGradient(
                            colors: [Color.primaryPink, Color.primaryPink.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
                    .shadow(color: Color.primaryPink.opacity(0.4), radius: 12, x: 0, y: 6)
            }
        }
    }

    // MARK: - Undo Button

    private var undoButton: some View {
        Button(action: {
            Task {
                await viewModel.undoLastSwipe()
                withAnimation {
                    showUndo = false
                }
            }
        }) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.uturn.backward")
                    .font(.subheadline)
                Text("Undo \(viewModel.lastSwipeDirection == .right ? "Like" : "Pass")")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(.systemBackground).opacity(0.95))
            .cornerRadius(24)
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(Color.primaryPink, lineWidth: 2)
            )
            .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
        }
    }

    private func showUndoTemporarily() {
        // Cancel previous work item
        undoWorkItem?.cancel()

        withAnimation(.spring(response: 0.3)) {
            showUndo = true
        }

        // Hide after 5 seconds
        let workItem = DispatchWorkItem {
            withAnimation {
                showUndo = false
            }
        }
        undoWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: workItem)
    }

    // MARK: - Empty States

    @ViewBuilder
    private var emptyStateView: some View {
        // Reference countdownTick to ensure view updates every second during countdown
        let _ = countdownTick

        VStack(spacing: 24) {
            Spacer()

            if dataStore.events.isEmpty {
                // No events joined at all
                noEventsState
            } else if dataStore.liveEvents.isEmpty && dataStore.upcomingEvents.isEmpty {
                // Has events but all are closed
                allEventsClosedState
            } else if let event = selectedEvent {
                if let countdown = event.matchmakingStartsIn, countdown > 0 {
                    // Upcoming - show live countdown (updates every second)
                    upcomingEventState(countdown: countdown)
                } else if event.isClosed {
                    // Event closed (shouldn't happen with new logic, but handle it)
                    eventClosedState
                } else {
                    // No more profiles
                    noMoreProfilesState
                }
            } else {
                noEventsState
            }

            Spacer()
        }
        .padding(32)
    }

    private var noEventsState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 56))
                .foregroundColor(.secondary)

            Text("Join an Event")
                .font(.title2)
                .fontWeight(.bold)

            Text("Enter an event code from your hosts to start matching!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: {
                // Navigate to join event - handled by parent
            }) {
                Text("Join Event")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.primaryPink)
        }
    }

    private func upcomingEventState(countdown: TimeInterval) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.fill")
                .font(.system(size: 56))
                .foregroundColor(Color.primaryPink)

            Text("Matchmaking Opens Soon")
                .font(.title2)
                .fontWeight(.bold)

            Text(formatCountdown(countdown))
                .font(.system(size: 36, weight: .bold, design: .monospaced))
                .foregroundColor(Color.primaryPink)

            Text("Get ready to meet other guests!")
                .font(.body)
                .foregroundColor(.secondary)
        }
    }

    private var eventClosedState: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.fill")
                .font(.system(size: 56))
                .foregroundColor(.secondary)

            Text("Matchmaking Closed")
                .font(.title2)
                .fontWeight(.bold)

            Text("This event's matchmaking period has ended. Check your chats to continue conversations!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: {
                // Navigate to chats
            }) {
                Text("View Chats")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.primaryPink)
        }
    }

    private var allEventsClosedState: some View {
        VStack(spacing: 16) {
            Image(systemName: "party.popper")
                .font(.system(size: 56))
                .foregroundColor(.secondary)

            Text("All Events Closed")
                .font(.title2)
                .fontWeight(.bold)

            Text("Your past events have ended. Join a new event to start matching again!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: {
                // Navigate to home/events
            }) {
                Text("Browse Events")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.primaryPink)
        }
    }

    private var noMoreProfilesState: some View {
        VStack(spacing: 16) {
            Image("matchmaking-icon")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: 56, height: 56)
                .foregroundColor(Color.primaryPink)

            Text("You've Seen Everyone!")
                .font(.title2)
                .fontWeight(.bold)

            Text("Check back later - new guests may join this event soon.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: {
                Task {
                    await viewModel.loadProfiles()
                }
            }) {
                Text("Refresh")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.bordered)
        }
    }

    private func formatCountdown(_ interval: TimeInterval) -> String {
        let days = Int(interval) / 86400
        let hours = (Int(interval) % 86400) / 3600
        let minutes = (Int(interval) % 3600) / 60
        let seconds = Int(interval) % 60

        if days > 0 {
            return "\(days)d \(hours)h \(minutes)m"
        } else {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }
    }
}

// MARK: - Profile Content Card

struct ProfileContentCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color.primaryPink)

            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.secondary.opacity(0.08))
        .cornerRadius(24)
    }
}

// MARK: - Event Selector Sheet

struct EventSelectorSheet: View {
    let events: [Event]
    let selectedEventId: String?
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss

    private var liveEvents: [Event] {
        events.filter { $0.isMatchmakingOpen && !$0.isClosed }
    }

    private var upcomingEvents: [Event] {
        events.filter { !$0.isMatchmakingOpen && !$0.isClosed && ($0.matchmakingStartsIn ?? 0) > 0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Live Events
                    if !liveEvents.isEmpty {
                        eventSection(
                            title: "Live",
                            badge: liveBadge,
                            events: liveEvents,
                            status: .live
                        )
                    }

                    // Upcoming Events
                    if !upcomingEvents.isEmpty {
                        eventSection(
                            title: "Upcoming",
                            badge: upcomingBadge,
                            events: upcomingEvents,
                            status: .upcoming
                        )
                    }

                    // Empty state when no live or upcoming events
                    if liveEvents.isEmpty && upcomingEvents.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "calendar.badge.clock")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)

                            Text("No Active Events")
                                .font(.headline)
                                .foregroundColor(.secondary)

                            Text("Join an event to start matching!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.top, 40)
                    }
                }
                .padding(20)
            }
            .navigationTitle("Select Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var liveBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(Color.white)
                .frame(width: 6, height: 6)
            Text("Live")
                .font(.caption)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(Color.green)
        .foregroundColor(.white)
        .cornerRadius(12)
    }

    private var upcomingBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "clock")
                .font(.caption2)
            Text("Soon")
                .font(.caption)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(Color.secondary.opacity(0.2))
        .foregroundColor(.primary)
        .cornerRadius(12)
    }

    enum EventStatus {
        case live, upcoming
    }

    @ViewBuilder
    private func eventSection(title: String, badge: some View, events: [Event], status: EventStatus) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                badge
                Text("\(title) Events")
                    .font(.headline)
                Text("(\(events.count))")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 8) {
                ForEach(events) { event in
                    eventCard(event, status: status)
                }
            }
        }
    }

    @ViewBuilder
    private func eventCard(_ event: Event, status: EventStatus) -> some View {
        let isSelected = event.id == selectedEventId

        Button(action: { onSelect(event.id) }) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.name)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    if let date = event.formattedDate {
                        Text(date)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color.primaryPink)
                }
            }
            .padding(16)
            .background(isSelected ? Color.primaryPink.opacity(0.1) : Color(.secondarySystemBackground))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.primaryPink : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        MatchmakingView()
            .environmentObject(AuthState())
            .environmentObject(AppState())
            .environmentObject(DataStore())
    }
}
