import SwiftUI

/// Home view showing user's events - matches React/Capacitor version
struct HomeView: View {
    @EnvironmentObject var authState: AuthState
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dataStore: DataStore

    @State private var showJoinEvent = false
    @State private var showFABMenu = false
    @State private var sortBy: SortOption = .name
    @State private var filterStatus: FilterOption = .active
    @State private var eventToLeave: Event?
    @State private var showLeaveConfirmation = false
    @State private var eventToReport: Event?
    @State private var showReportSheet = false

    enum SortOption: String, CaseIterable {
        case date = "Date"
        case name = "Name"
        case status = "Status"
    }

    enum FilterOption: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case closed = "Closed"
    }

    var filteredAndSortedEvents: [Event] {
        var events = dataStore.events

        // Filter
        switch filterStatus {
        case .all:
            break
        case .active:
            events = events.filter { $0.isMatchmakingOpen || !$0.isClosed }
        case .closed:
            events = events.filter { $0.isClosed }
        }

        // Sort
        switch sortBy {
        case .date:
            events.sort { ($0.date ?? Date.distantPast) < ($1.date ?? Date.distantPast) }
        case .name:
            events.sort { $0.name.localizedCompare($1.name) == .orderedAscending }
        case .status:
            events.sort { ($0.isClosed ? 1 : 0) < ($1.isClosed ? 1 : 0) }
        }

        return events
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerView
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .padding(.bottom, 24)

                    // Title with count
                    HStack {
                        Text("Events I'm Attending (\(filteredAndSortedEvents.count))")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)

                    // Sort & Filter Controls
                    if !dataStore.events.isEmpty {
                        sortAndFilterControls
                            .padding(.horizontal, 16)
                            .padding(.bottom, 16)
                    }

                    // Content
                    if dataStore.isLoadingEvents && dataStore.events.isEmpty {
                        loadingPlaceholders
                    } else if filteredAndSortedEvents.isEmpty {
                        emptyState
                    } else {
                        eventsList
                    }

                    Spacer(minLength: 120)
                }
            }
            .refreshable {
                await dataStore.refreshEvents()
            }

            // Floating Action Button
            fabButton
                .padding(.trailing, 20)
                .padding(.bottom, 100)
        }
        .background(Color(.systemBackground))
        .navigationBarHidden(true)
        .sheet(isPresented: $showJoinEvent) {
            JoinEventView()
        }
        .sheet(isPresented: $showReportSheet) {
            if let event = eventToReport {
                ReportEventSheet(event: event)
            }
        }
        .alert("Leave Event?", isPresented: $showLeaveConfirmation, presenting: eventToLeave) { event in
            Button("Cancel", role: .cancel) {
                eventToLeave = nil
            }
            Button("Leave", role: .destructive) {
                Task {
                    await leaveEvent(event)
                }
            }
        } message: { event in
            Text("Are you sure you want to leave \"\(event.name)\"? You'll need a new invite code to rejoin.")
        }
        .task {
            // Only load if not already loaded (DataStore handles caching)
            await dataStore.loadEvents()
        }
    }

    // MARK: - Header

    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(String(localized: "events"))
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Text(String(localized: "events_subtitle"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }

    // MARK: - Sort & Filter

    private var sortAndFilterControls: some View {
        HStack(spacing: 12) {
            // Sort picker
            Menu {
                ForEach(SortOption.allCases, id: \.self) { option in
                    Button(action: { sortBy = option }) {
                        HStack {
                            Text(option.rawValue)
                            if sortBy == option {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.up.arrow.down")
                        .font(.caption)
                    Text(sortBy.rawValue)
                        .font(.subheadline)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }

            // Filter picker
            Menu {
                ForEach(FilterOption.allCases, id: \.self) { option in
                    Button(action: { filterStatus = option }) {
                        HStack {
                            Text(option.rawValue)
                            if filterStatus == option {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "line.3.horizontal.decrease")
                        .font(.caption)
                    Text(filterStatus.rawValue)
                        .font(.subheadline)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }

            Spacer()
        }
    }

    // MARK: - Loading Placeholders

    private var loadingPlaceholders: some View {
        VStack(spacing: 12) {
            ForEach(0..<3, id: \.self) { _ in
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 80, height: 80)

                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 150, height: 20)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 100, height: 16)
                    }
                    Spacer()
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
            }
        }
        .padding(.horizontal, 16)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text(filterStatus != .all ? "No \(filterStatus.rawValue.lowercased()) events found" : "No events yet")
                .font(.headline)
                .foregroundColor(.secondary)

            if filterStatus == .all {
                Text("Join a wedding using an invite link from your hosts!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Button(action: { showJoinEvent = true }) {
                    Text("Enter Event Code")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.top, 60)
    }

    // MARK: - Events List

    private var eventsList: some View {
        LazyVStack(spacing: 12) {
            ForEach(filteredAndSortedEvents) { event in
                Button {
                    // Navigate to Match tab with this event selected
                    appState.selectedEventId = event.id
                    appState.selectedTab = .match
                } label: {
                    EventRowCard(event: event)
                }
                .buttonStyle(.plain)
                .contextMenu {
                    // View event action
                    Button {
                        appState.selectedEventId = event.id
                        appState.selectedTab = .match
                    } label: {
                        Label("Open Event", systemImage: "arrow.right.circle")
                    }

                    Divider()

                    // Report event
                    Button {
                        eventToReport = event
                        showReportSheet = true
                    } label: {
                        Label("Report Event", systemImage: "flag")
                    }

                    // Leave event (destructive)
                    Button(role: .destructive) {
                        eventToLeave = event
                        showLeaveConfirmation = true
                    } label: {
                        Label("Leave Event", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                } preview: {
                    // 3D Touch preview showing event card
                    EventRowCard(event: event)
                        .frame(width: 320)
                        .padding(8)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        eventToLeave = event
                        showLeaveConfirmation = true
                    } label: {
                        Label("Leave", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
        }
        .padding(.horizontal, 16)
    }

    // MARK: - FAB

    private var fabButton: some View {
        VStack(spacing: 12) {
            // Join Event button (shown when FAB expanded)
            if showFABMenu {
                Button(action: {
                    showJoinEvent = true
                    showFABMenu = false
                }) {
                    Text("Join Event")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color(.systemBackground))
                        .cornerRadius(24)
                        .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            // Main FAB
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    showFABMenu.toggle()
                }
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.primaryPink)
                    .clipShape(Circle())
                    .shadow(color: Color.primaryPink.opacity(0.4), radius: 8, x: 0, y: 4)
                    .rotationEffect(.degrees(showFABMenu ? 45 : 0))
            }
        }
    }
}

// MARK: - Event Row Card (Horizontal layout with circular image)

struct EventRowCard: View {
    let event: Event

    var body: some View {
        HStack(spacing: 12) {
            // Circular event image
            eventImage
                .frame(width: 80, height: 80)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)

            // Event info
            VStack(alignment: .leading, spacing: 4) {
                Text(event.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .lineLimit(1)

                if let date = event.formattedDate {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.caption)
                        Text(date)
                            .font(.subheadline)
                    }
                    .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Status badge and chevron
            VStack(alignment: .trailing, spacing: 8) {
                statusBadge

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    @ViewBuilder
    private var eventImage: some View {
        if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure, .empty:
                    eventPlaceholder
                @unknown default:
                    eventPlaceholder
                }
            }
        } else {
            eventPlaceholder
        }
    }

    private var eventPlaceholder: some View {
        Circle()
            .fill(
                LinearGradient(
                    colors: [Color.primaryPink.opacity(0.6), Color.primaryPurple.opacity(0.6)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .overlay(
                Image(systemName: "sparkles")
                    .font(.title2)
                    .foregroundColor(.white.opacity(0.8))
            )
    }

    @ViewBuilder
    private var statusBadge: some View {
        if event.isClosed {
            Text("Closed")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.gray.opacity(0.2))
                .cornerRadius(12)
        } else {
            Text("Active")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
        }
    }
}

// MARK: - Report Event Sheet

struct ReportEventSheet: View {
    let event: Event
    @Environment(\.dismiss) var dismiss
    @State private var selectedReason: ReportReason?
    @State private var additionalDetails = ""
    @State private var isSubmitting = false
    @State private var showSuccess = false

    enum ReportReason: String, CaseIterable {
        case inappropriate = "Inappropriate content"
        case spam = "Spam or fake event"
        case harassment = "Harassment"
        case other = "Other"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Report: \(event.name)")
                        .font(.headline)
                }

                Section("What's the issue?") {
                    ForEach(ReportReason.allCases, id: \.self) { reason in
                        Button {
                            selectedReason = reason
                        } label: {
                            HStack {
                                Text(reason.rawValue)
                                    .foregroundColor(.primary)
                                Spacer()
                                if selectedReason == reason {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(Color.primaryPink)
                                }
                            }
                        }
                    }
                }

                Section("Additional details (optional)") {
                    TextField("Tell us more...", text: $additionalDetails, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section {
                    Button {
                        submitReport()
                    } label: {
                        HStack {
                            Spacer()
                            if isSubmitting {
                                ProgressView()
                            } else {
                                Text("Submit Report")
                                    .fontWeight(.semibold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(selectedReason == nil || isSubmitting)
                }
            }
            .navigationTitle("Report Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Report Submitted", isPresented: $showSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Thank you for your report. We'll review it shortly.")
            }
        }
    }

    private func submitReport() {
        guard let reason = selectedReason else { return }
        isSubmitting = true

        // In a real app, you'd send this to your backend
        Task {
            // Simulate network delay
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            isSubmitting = false
            showSuccess = true
        }
    }
}

// MARK: - Leave Event

extension HomeView {
    private func leaveEvent(_ event: Event) async {
        guard let userId = authState.currentUserId else { return }

        do {
            try await EventService.shared.leaveEvent(userId: userId, eventId: event.id)
            dataStore.removeEvent(event.id)
            eventToLeave = nil
        } catch {
            print("Error leaving event: \(error)")
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let eventJoined = Notification.Name("eventJoined")
}

// MARK: - Preview
#Preview {
    NavigationStack {
        HomeView()
            .environmentObject(AuthState())
            .environmentObject(AppState())
            .environmentObject(DataStore())
    }
}
