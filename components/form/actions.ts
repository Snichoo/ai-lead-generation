"use server";

import { parseWithZod } from "@conform-to/zod";
import { inputSchema } from "@/lib/zodSchemas"

export async function SubmitForm(state: any, formData: FormData) {
    const submission = parseWithZod(formData, {
        schema: inputSchema,
    });

    if (submission.status !== "success") {
        return submission.reply();
    }

    return { status: "success" };
}

export async function scrapeWebsites(businessType: string, location: string) {
  // Simulate multi-step process with time delays for each step
  console.log(`Starting Step 1: Scraping website for ${businessType} in ${location}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));  // Simulate delay

  console.log(`Starting Step 2: Scraping another website for ${businessType} in ${location}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));  // Simulate delay

  console.log(`Starting Step 3: Processing data for ${businessType} in ${location}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));  // Simulate delay
  // Add more steps as necessary
}