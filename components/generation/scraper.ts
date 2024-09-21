"use server";

import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Load the environment variables from the .env file
dotenv.config();

const openai = new OpenAI();

const LocationCheck = z.object({
  isBroadLocation: z.boolean(),
});

async function checkLocation(userInput: string): Promise<string> {
  console.log(`User input received: ${userInput}`);

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content:
            "Determine if the user input is too broad of a location, suburbs or small cities are not broad location. Be mindful of user typo and synonyms. Example of broad location: sydney, brisbane, melbourne, adelaide, perth, gold coast, canberra, newcastle, wollongong, geelong, townville, cairns, toowoomba, ballarat, bendigo, albury wodonga etc",
        },
        { role: "user", content: userInput.toLowerCase() },
      ],
      response_format: zodResponseFormat(LocationCheck, "location_check"),
    });

    console.log("API request completed successfully.");
    console.log("Completion object received:", completion);

    const result: { isBroadLocation: boolean } | null = completion.choices[0].message.parsed;

    if (result !== null && result.isBroadLocation !== undefined) {
      return result.isBroadLocation ? "yes" : "no";
    } else {
      console.log("Result is null or undefined.");
      return "no";  // Default fallback value
    }
    
  } catch (error) {
    console.error("Error during location check:", error);
    throw error; // Rethrow the error if necessary
  }
}

export async function generateLeads(businessType: string, location: string): Promise<string> {
    try {
      const response = await checkLocation(location);
      console.log("Location check result:", response);
  
      // Add any additional lead generation logic here.
      // Simulate lead generation process
      await new Promise((resolve) => setTimeout(resolve, 2000));  // Simulate async processing
  
      return "Lead generation successful"; // Return success message
    } catch (error) {
      console.error("Error in the location check function:", error);
      return "Lead generation failed";
    }
  }
  