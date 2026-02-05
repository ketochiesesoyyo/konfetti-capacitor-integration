import Foundation

/// Event model matching Supabase events table
struct Event: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var dateString: String?  // Raw date string from DB (format: "2026-02-21")
    var description: String?
    let inviteCode: String
    var status: String
    let createdBy: String
    var closeDateString: String?  // Raw date string
    var matchmakingStartDateString: String?  // Raw date string
    var matchmakingStartTimeString: String?  // Raw time string
    var matchmakingCloseDateString: String?  // Raw datetime string
    var imageUrl: String?
    let createdAtString: String?
    let updatedAtString: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case dateString = "date"
        case description
        case inviteCode = "invite_code"
        case status
        case createdBy = "created_by"
        case closeDateString = "close_date"
        case matchmakingStartDateString = "matchmaking_start_date"
        case matchmakingStartTimeString = "matchmaking_start_time"
        case matchmakingCloseDateString = "matchmaking_close_date"
        case imageUrl = "image_url"
        case createdAtString = "created_at"
        case updatedAtString = "updated_at"
    }

    // MARK: - Computed Date Properties

    var date: Date? { DateParser.parse(dateString) }
    var closeDate: Date? { DateParser.parse(closeDateString) }
    var matchmakingStartDate: Date? { DateParser.parse(matchmakingStartDateString) }
    var matchmakingStartTime: Date? { DateParser.parseTime(matchmakingStartTimeString) }
    var matchmakingCloseDate: Date? { DateParser.parse(matchmakingCloseDateString) }
    var createdAt: Date? { DateParser.parse(createdAtString) }
    var updatedAt: Date? { DateParser.parse(updatedAtString) }

    // MARK: - Computed Properties

    var isActive: Bool {
        status == "active"
    }

    var isClosed: Bool {
        status == "closed"
    }

    var formattedDate: String? {
        guard let date = date else { return nil }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeZone = TimeZone(identifier: "UTC")  // Preserve UTC date (prevents day shift)
        return formatter.string(from: date)
    }

    var formattedMatchmakingStart: String? {
        guard let startDate = matchmakingStartDate else { return nil }

        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium

        var dateString = dateFormatter.string(from: startDate)

        if let startTime = matchmakingStartTime {
            let timeFormatter = DateFormatter()
            timeFormatter.timeStyle = .short
            dateString += " at \(timeFormatter.string(from: startTime))"
        }

        return dateString
    }

    var isMatchmakingOpen: Bool {
        guard isActive else { return false }

        let now = Date()

        // Check start time
        if let startDate = matchmakingStartDate {
            let startTime = matchmakingStartTime ?? Calendar.current.startOfDay(for: startDate)
            let combinedStart = combineDateAndTime(date: startDate, time: startTime)
            if now < combinedStart {
                return false
            }
        }

        // Check close time
        if let closeDate = matchmakingCloseDate, now > closeDate {
            return false
        }

        return true
    }

    var matchmakingStartsIn: TimeInterval? {
        guard let startDate = matchmakingStartDate else { return nil }

        let startTime = matchmakingStartTime ?? Calendar.current.startOfDay(for: startDate)
        let combinedStart = combineDateAndTime(date: startDate, time: startTime)

        let now = Date()
        if now < combinedStart {
            return combinedStart.timeIntervalSince(now)
        }

        return nil
    }

    private func combineDateAndTime(date: Date, time: Date) -> Date {
        let calendar = Calendar.current
        let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)
        let timeComponents = calendar.dateComponents([.hour, .minute], from: time)

        var combined = DateComponents()
        combined.year = dateComponents.year
        combined.month = dateComponents.month
        combined.day = dateComponents.day
        combined.hour = timeComponents.hour
        combined.minute = timeComponents.minute

        return calendar.date(from: combined) ?? date
    }

    // MARK: - Hashable

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Event, rhs: Event) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Event Status
enum EventStatus: String {
    case active
    case closed

    var displayName: String {
        switch self {
        case .active: return "Active"
        case .closed: return "Closed"
        }
    }
}
