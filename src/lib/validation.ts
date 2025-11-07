import { z } from 'zod';

// Event validation
export const eventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

// Profile validation
export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  age: z.number().int().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
  bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
  gender: z.enum(['man', 'woman', 'non-binary'], { errorMap: () => ({ message: 'Please select a valid gender' }) }).optional(),
  interested_in: z.enum(['men', 'women', 'both'], { errorMap: () => ({ message: 'Please select who you\'re interested in' }) }).optional(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed'),
  age_min: z.number().int().min(18).max(120).optional(),
  age_max: z.number().int().min(18).max(120).optional(),
  instagram_username: z.string().trim().max(30, 'Instagram username must be less than 30 characters').optional(),
});

// Swipe validation
export const swipeSchema = z.object({
  direction: z.enum(['left', 'right'], { errorMap: () => ({ message: 'Invalid swipe direction' }) }),
  swiped_user_id: z.string().uuid('Invalid user ID'),
  event_id: z.string().uuid('Invalid event ID'),
});

// Report validation
export const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason').max(100, 'Reason must be less than 100 characters'),
  custom_reason: z.string().trim().max(500, 'Details must be less than 500 characters').optional(),
});

// Message validation
export const messageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(5000, 'Message must be less than 5000 characters'),
});

// Match validation
export const matchSchema = z.object({
  user1_id: z.string().uuid('Invalid user ID'),
  user2_id: z.string().uuid('Invalid user ID'),
  event_id: z.string().uuid('Invalid event ID'),
});
