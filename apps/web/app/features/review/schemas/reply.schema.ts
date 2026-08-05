import { z } from 'zod';

export const replySchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty.'),
});

export type ReplyInput = z.infer<typeof replySchema>;
