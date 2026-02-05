import SwiftUI

/// A double-ended slider for selecting a range of values
struct RangeSlider: View {
    @Binding var lowValue: Int
    @Binding var highValue: Int
    let range: ClosedRange<Int>
    
    @State private var isDraggingLow = false
    @State private var isDraggingHigh = false
    
    private let trackHeight: CGFloat = 4
    private let thumbSize: CGFloat = 28
    
    var body: some View {
        GeometryReader { geometry in
            let trackWidth = geometry.size.width - thumbSize
            let totalRange = CGFloat(range.upperBound - range.lowerBound)
            
            // Calculate positions
            let lowPosition = CGFloat(lowValue - range.lowerBound) / totalRange * trackWidth
            let highPosition = CGFloat(highValue - range.lowerBound) / totalRange * trackWidth
            
            ZStack(alignment: .leading) {
                // Background track
                Capsule()
                    .fill(Color(.systemGray5))
                    .frame(height: trackHeight)
                    .offset(x: thumbSize / 2)
                
                // Active range track
                Capsule()
                    .fill(Color.primaryPink)
                    .frame(width: max(0, highPosition - lowPosition), height: trackHeight)
                    .offset(x: lowPosition + thumbSize / 2)
                
                // Low value thumb
                Circle()
                    .fill(Color.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.2), radius: 3, x: 0, y: 2)
                    .overlay(
                        Circle()
                            .stroke(Color.primaryPink, lineWidth: 2)
                    )
                    .offset(x: lowPosition)
                    .scaleEffect(isDraggingLow ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.2), value: isDraggingLow)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                isDraggingLow = true
                                let newPosition = max(0, min(trackWidth, value.location.x - thumbSize / 2))
                                let newValue = Int(round(newPosition / trackWidth * totalRange)) + range.lowerBound
                                
                                // Ensure low value doesn't exceed high value
                                lowValue = min(newValue, highValue - 1)
                            }
                            .onEnded { _ in
                                isDraggingLow = false
                            }
                    )
                
                // High value thumb
                Circle()
                    .fill(Color.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.2), radius: 3, x: 0, y: 2)
                    .overlay(
                        Circle()
                            .stroke(Color.primaryPink, lineWidth: 2)
                    )
                    .offset(x: highPosition)
                    .scaleEffect(isDraggingHigh ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.2), value: isDraggingHigh)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                isDraggingHigh = true
                                let newPosition = max(0, min(trackWidth, value.location.x - thumbSize / 2))
                                let newValue = Int(round(newPosition / trackWidth * totalRange)) + range.lowerBound
                                
                                // Ensure high value doesn't go below low value
                                highValue = max(newValue, lowValue + 1)
                            }
                            .onEnded { _ in
                                isDraggingHigh = false
                            }
                    )
            }
            .frame(height: thumbSize)
        }
        .frame(height: thumbSize)
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 40) {
        VStack(alignment: .leading, spacing: 12) {
            Text("Age Range: 25 to 45")
                .font(.headline)
            
            RangeSlider(
                lowValue: .constant(25),
                highValue: .constant(45),
                range: 18...65
            )
            
            HStack {
                Text("18")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("65")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        
        VStack(alignment: .leading, spacing: 12) {
            Text("Distance: 10 to 50 miles")
                .font(.headline)
            
            RangeSlider(
                lowValue: .constant(10),
                highValue: .constant(50),
                range: 1...100
            )
            
            HStack {
                Text("1")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("100")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    .padding()
}
