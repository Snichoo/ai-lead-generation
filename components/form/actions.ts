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