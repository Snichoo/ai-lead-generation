import { z } from "zod";

export const inputSchema = z.object({
    businessType: z.string().min(1).max(40),
    location: z.string().min(1).max(40),
});