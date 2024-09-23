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
            "Determine if the user input is too broad of a location, suburbs or small cities are not broad location. Be mindful of user typo and synonyms. Example of broad location: Eastern Suburb Sydney, North Sydney, sydney, brisbane, melbourne, adelaide, perth, gold coast, canberra, newcastle, wollongong, geelong, townville, cairns, toowoomba, ballarat, bendigo, albury wodonga etc",
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

  const fs = require('fs');
  const path = require('path');
  
  // Function to scrape Google Maps for businesses based on business type and location
  async function scrapeGoogleMaps(businessType: string, locationQuery: string): Promise<any[]> {
    const input = {
      searchStringsArray: [businessType],
      locationQuery: locationQuery,
      maxCrawledPlacesPerSearch: 5,
      language: "en",
      maxImages: 0,
      scrapeImageAuthors: false,
      onlyDataFromSearchPage: false,
      includeWebResults: false,
      scrapeDirectories: true,
      deeperCityScrape: true,
      searchMatching: "all",
      placeMinimumStars: "",
      skipClosedPlaces: false,
      allPlacesNoSearchAction: ""
    };
  
    const { ApifyClient } = require('apify-client');
    const client = new ApifyClient({ token: 'apify_api_bYP6N7TcTOyoIoUcfc9yqM4rSfTRff40K3JQ' });
  
    try {
      // Run the Actor for the specified location and business type
      const run = await client.actor("nwua9Gu5YrADL7ZDj").call(input);
  
      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
  
      // Map each item to a JSON format
      const results = items.map((item: any) => ({
        title: item.title,
        address: item.address,
        website: item.website || '',
        phone: item.phoneUnformatted || '',
      }));
  
      // Log what has been scraped for this suburb
      console.log(`Scraped data for location: ${locationQuery}`);
      console.log(JSON.stringify(results, null, 2)); // Pretty print the JSON result
  
      return results;
    } catch (error) {
      console.error("Error in scrapeGoogleMaps:", error);
      throw error;
    }
  }
  
  // Function to remove duplicates based on a unique key (e.g., phone or title)
  function removeDuplicates(results: any[]): any[] {
    const seen = new Set();
    return results.filter((item) => {
      const identifier = item.phone || item.title; // Use phone or title as the unique identifier
      if (seen.has(identifier)) {
        return false; // If already seen, remove the duplicate
      }
      seen.add(identifier);
      return true; // Keep unique entries
    });
  }
  
  // Function to write the final JSON to a file
  function saveToFile(filename: string, data: any) {
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved JSON data to ${filepath}`);
  }
  
// Helper function to handle actor concurrency and collect results
async function runActorPool(businessType: string, suburbs: string[], maxConcurrency: number): Promise<any[]> {
  const allResults: any[] = [];
  const allPromises: Promise<void>[] = [];
  let activeCount = 0;
  let nextIndex = 0;

  return new Promise<void>((resolve, reject) => {
    function runNextActor() {
      // Start new actors while we haven't reached maxConcurrency and there are suburbs left
      while (activeCount < maxConcurrency && nextIndex < suburbs.length) {
        const suburb = suburbs[nextIndex++];
        activeCount++;
        console.log(`Starting actor for suburb: ${suburb}`);
        const actorPromise = scrapeGoogleMaps(businessType, suburb)
          .then((results) => {
            console.log(`Actor completed for suburb: ${suburb}`);
            allResults.push(...results); // Collect the results
          })
          .catch((error) => {
            console.error(`Error running actor for suburb: ${suburb}`, error);
          })
          .finally(() => {
            activeCount--;
            if (activeCount === 0 && nextIndex >= suburbs.length) {
              resolve(); // All actors have finished
            } else {
              runNextActor(); // Start the next actor
            }
          });
        allPromises.push(actorPromise);
      }
    }

    runNextActor();
  }).then(() => Promise.all(allPromises).then(() => allResults));
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
  
        // Run a pool of 7 actors at a time and collect results
        const allResults = await runActorPool(businessType, structuredSuburbs, 7);
  
        // Remove duplicates from the combined results
        const uniqueResults = removeDuplicates(allResults);
  
        // Save final results to JSON file
        saveToFile('finalResults.json', uniqueResults);
  
        return `Lead generation completed. Final results saved with ${uniqueResults.length} unique businesses.`;
      } else {
        console.log("Specific location detected, scraping Google Maps...");
        const results = await scrapeGoogleMaps(businessType, location);
  
        // Remove duplicates in case of single-location scraping
        const uniqueResults = removeDuplicates(results);
  
        // Save final results to JSON file
        saveToFile('finalResults.json', uniqueResults);
  
        return `Lead generation successful for location: ${location}, with ${uniqueResults.length} unique businesses.`;
      }
    } catch (error) {
      console.error("Error in the lead generation process:", error);
      return "Lead generation failed";
    }
  }
  
  