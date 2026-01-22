-- Add event_id column to event_requests to link requests to created events
ALTER TABLE event_requests 
ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_event_requests_event_id ON event_requests(event_id);