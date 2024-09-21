"use server";

import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Load the environment variables from the .env file
dotenv.config();

const openai = new OpenAI();

// Schema to validate the response format from OpenAI
const LocationCheck = z.object({
  isBroadLocation: z.boolean(),
});

const SuburbListSchema = z.object({
    suburbs: z.array(z.string()), // Ensuring the response is an array of suburb strings
});

// Function to check if the location is broad or specific
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

// Function to call Perplexity API and get suburbs list
async function listSuburbs(location: string): Promise<string> {
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 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',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-huge-128k-online",
      messages: [
        {
          role: "system",
          content: "List every single suburb in this location.",
        },
        {
          role: "user",
          content: location,
        }
      ],
      temperature: 0.2,
      top_p: 0.9,
      return_citations: true,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1
    })
  };

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', options);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0].message.content;

    console.log('Suburbs List:', messageContent);
    return messageContent;
  } catch (err) {
    console.error('Error fetching suburbs list:', err);
    throw err;
  }
}

// Function to extract structured suburbs from unstructured listSuburbs response
async function extractSuburbs(unstructuredSuburbs: string): Promise<string[]> {
    const openai = new OpenAI();
  
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: "Extract the list of suburbs from the given text." },
        { role: "user", content: unstructuredSuburbs },
      ],
      response_format: zodResponseFormat(SuburbListSchema, "suburb_list"),
    });
  
    // Check if completion, choices, message, and parsed are valid
    if (
      completion &&
      completion.choices &&
      completion.choices.length > 0 &&
      completion.choices[0].message &&
      completion.choices[0].message.parsed &&
      completion.choices[0].message.parsed.suburbs
    ) {
      // Parse the structured suburb list
      const suburbList = completion.choices[0].message.parsed.suburbs;
      return suburbList;
    } else {
      throw new Error("Failed to extract structured suburbs.");
    }
  }  

// Main function to generate leads and handle location check + suburbs listing
export async function generateLeads(businessType: string, location: string): Promise<string> {
  try {
    const locationCheckResult = await checkLocation(location);
    console.log("Location check result:", locationCheckResult);

    if (locationCheckResult === "yes") {
      console.log("Broad location detected, fetching list of suburbs...");
      const unstructuredSuburbs = await listSuburbs(location);
      console.log("Suburbs list retrieved:", unstructuredSuburbs);
      const structuredSuburbs = await extractSuburbs(unstructuredSuburbs);
      console.log("Structured Suburb List:", structuredSuburbs);
      return `Broad location detected. Suburbs in ${location}: ${unstructuredSuburbs}`;
    }

    // If the location is not broad, proceed with lead generation
    // Add any additional lead generation logic here.
    console.log("Specific location detected, proceeding with lead generation...");
    await new Promise((resolve) => setTimeout(resolve, 2000));  // Simulate async processing

    return "Lead generation successful"; // Return success message
  } catch (error) {
    console.error("Error in the lead generation process:", error);
    return "Lead generation failed";
  }
}
