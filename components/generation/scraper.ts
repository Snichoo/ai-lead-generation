"use server";

import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

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

    const result: { isBroadLocation: boolean } | null =
      completion.choices[0].message.parsed;

    if (result !== null && result.isBroadLocation !== undefined) {
      return result.isBroadLocation ? "yes" : "no";
    } else {
      console.log("Result is null or undefined.");
      return "no"; // Default fallback value
    }
  } catch (error) {
    console.error("Error during location check:", error);
    throw error; // Rethrow the error if necessary
  }
}

// Function to call Perplexity API and get suburbs list
async function listSuburbs(location: string): Promise<string> {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${
        process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || ""
      }`,
      "Content-Type": "application/json",
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
        },
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
      frequency_penalty: 1,
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0].message.content;

    console.log("Suburbs List:", messageContent);
    return messageContent;
  } catch (err) {
    console.error("Error fetching suburbs list:", err);
    throw err;
  }
}

// Function to extract structured suburbs from unstructured listSuburbs response
async function extractSuburbs(unstructuredSuburbs: string): Promise<string[]> {
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content: "Extract the list of suburbs from the given text.",
      },
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

// Define the schema for the output structure
const PersonSchema = z.object({
  id: z.string(),
  title: z.string(),
});

// Extend the schema to include additional details
const EnrichedPersonSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  title: z.string(),
  linkedin_url: z.string().url().optional(),
});

interface Organization {
  name?: string;
  domain?: string;
  website_url?: string;
  // Add other properties if needed
}

interface SearchResultPerson {
  id: string;
  title: string;
  organization: Organization;
  // Add other properties as needed
}

interface SearchResult {
  people: SearchResultPerson[];
  // Add other properties as needed
}

interface EnrichmentMatch {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
  // Add other properties as needed
}

interface EnrichmentResult {
  matches: EnrichmentMatch[];
  // Add other properties as needed
}

// Function to call the mixed people search API and return the highest role persons for multiple domains
async function getHighestRolePerson(
  organizationDomains: string[]
): Promise<{ id: string; title: string; domain: string }[]> {
  const searchUrl = "https://api.apollo.io/v1/mixed_people/search";

  const searchData = {
    q_organization_domains: organizationDomains.join("\n"), // Join domains by new line character
    page: 1,
    per_page: 10,
  };

  const headers = {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    "X-Api-Key": process.env.NEXT_PUBLIC_APOLLO_SEARCH_API_KEY || "",
  };

  try {
    // Step 1: Search for people in the organization domains
    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(searchData),
    });

    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }

    const searchResult: SearchResult = await searchResponse.json();

    if (!searchResult.people || searchResult.people.length === 0) {
      console.log(
        `No people found for domains: ${organizationDomains.join(", ")}`
      );
      return [];
    }

    // Group people by their organization domain
    const peopleByDomain: { [domain: string]: SearchResultPerson[] } = {};

    searchResult.people.forEach((person) => {
      const personDomain =
        person.organization?.domain ||
        (person.organization?.website_url
          ? new URL(person.organization.website_url).hostname
          : null);

      if (personDomain) {
        const normalizedDomain = personDomain.toLowerCase().replace(/^www\./, "");
        peopleByDomain[normalizedDomain] = peopleByDomain[normalizedDomain] || [];
        peopleByDomain[normalizedDomain].push(person);
      } else {
        console.log("Person without organization domain:", person);
      }
    });

    const highestRolePersons: { id: string; title: string; domain: string }[] =
      [];

    // For each domain, find the person with the highest role
    for (const domain of Object.keys(peopleByDomain)) {
      const people = peopleByDomain[domain];

      // Clean up the result by extracting only 'id' and 'title'
      const cleanedResults = people.map((person: SearchResultPerson) => ({
        id: person.id,
        title: person.title,
      }));

      // Use GPT to find the person with the highest role
      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that identifies the person with the highest role in a company based on their title.",
          },
          {
            role: "user",
            content: `Given the following people and their titles: ${JSON.stringify(
              cleanedResults
            )}. Find the person with the highest role.`,
          },
        ],
        response_format: zodResponseFormat(PersonSchema, "highest_role_person"),
      });

      const highestRolePerson: { id: string; title: string } | null =
        completion.choices[0].message.parsed;

      if (highestRolePerson) {
        highestRolePersons.push({ ...highestRolePerson, domain });
      } else {
        console.log(
          `Highest role person could not be determined for domain ${domain}.`
        );
      }
    }

    return highestRolePersons;
  } catch (error) {
    console.error("Error with Apollo API request or GPT processing:", error);
    return [];
  }
}

// Function to enrich up to 10 highest role persons at once
async function enrichHighestRolePersons(
  highestRolePersons: { id: string; title: string; companyIndex: number }[],
  savedData: any[]
) {
  if (highestRolePersons.length === 0) {
    console.log("No highest role persons to enrich.");
    return;
  }

  const enrichmentData = {
    reveal_personal_emails: true,
    reveal_phone_number: false,
    details: highestRolePersons.map((person) => ({ id: person.id })),
  };

  const enrichmentUrl = "https://api.apollo.io/api/v1/people/bulk_match";

  const headers = {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    "X-Api-Key": process.env.NEXT_PUBLIC_APOLLO_BULK_MATCH_API_KEY || "",
  };

  try {
    const enrichmentResponse = await fetch(enrichmentUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(enrichmentData),
    });

    if (!enrichmentResponse.ok) {
      throw new Error(`HTTP error! status: ${enrichmentResponse.status}`);
    }

    const enrichmentResult: EnrichmentResult = await enrichmentResponse.json();

    // Log the enrichment results
    console.log(`Bulk Enrichment Results:`, enrichmentResult);

    // Map enriched matches by ID for easy lookup
    const enrichedMatchesMap: { [id: string]: EnrichmentMatch } = {};
    enrichmentResult.matches.forEach((match) => {
      enrichedMatchesMap[match.id] = match;
    });

    // Update the corresponding companies in savedData
    highestRolePersons.forEach((person) => {
      const enrichedMatch = enrichedMatchesMap[person.id];
      if (enrichedMatch) {
        const company = savedData[person.companyIndex];
        if (!company) {
          console.error(
            `Company at index ${person.companyIndex} is undefined`
          );
          return; // or continue to the next iteration
        }
        company.first_name = enrichedMatch.first_name || "";
        company.last_name = enrichedMatch.last_name || "";
        company.company_personal_email = enrichedMatch.email || ""; // Changed from 'email' to 'company_personal_email'
        company.title = enrichedMatch.title || person.title;
        company.linkedin_url = enrichedMatch.linkedin_url || "";
        console.log(
          `Updated company at index ${person.companyIndex} with contact details:`,
          {
            first_name: company.first_name,
            last_name: company.last_name,
            company_personal_email: company.company_personal_email,
            title: company.title,
            linkedin_url: company.linkedin_url,
          }
        );
      } else {
        console.log(`Enriched data for person ID ${person.id} not found.`);
      }
    });
  } catch (error) {
    console.error("Error during bulk enrichment:", error);
  }
}

const { ApifyClient } = require("apify-client");

// Function to scrape Google Maps for businesses based on business type and location
async function scrapeGoogleMaps(
  businessType: string,
  locationQuery: string
): Promise<any[]> {
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
    allPlacesNoSearchAction: "",
  };

  const client = new ApifyClient({
    token: process.env.NEXT_PUBLIC_APIFY_API_TOKEN || "",
  });

  try {
    // Run the Actor for the specified location and business type
    const run = await client.actor("nwua9Gu5YrADL7ZDj").call(input);

    // Fetch Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Map each item to a JSON format
    const results = items.map((item: any) => ({
      company_name: item.title,
      address: item.address,
      website: item.website || "",
      company_phone: item.phoneUnformatted || "",
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
    const identifier = item.company_phone || item.company_name; // Use phone or title as the unique identifier
    if (seen.has(identifier)) {
      return false; // If already seen, remove the duplicate
    }
    seen.add(identifier);
    return true; // Keep unique entries
  });
}

// Function to write the final JSON to a file
function saveToFile(filename: string, data: any) {
  const filepath = path.join(process.cwd(), "public", "csv", filename);
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Saved JSON data to ${filepath}`);
}

function readJsonFromFile(filename: string): any[] {
  const filepath = path.join(process.cwd(), "public", "csv", filename);
  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(data);
  } else {
    return [];
  }
}

// Function to normalize URLs for consistent mapping
function normalizeUrl(urlStr: string): string {
  try {
    const parsedUrl = new URL(urlStr);
    // Remove www prefix
    if (parsedUrl.hostname.startsWith("www.")) {
      parsedUrl.hostname = parsedUrl.hostname.slice(4);
    }
    // Remove trailing slashes
    return parsedUrl.origin + parsedUrl.pathname.replace(/\/+$/, "");
  } catch (e) {
    return urlStr;
  }
}

// Helper function to handle actor concurrency and collect results
async function runActorPool(
  businessType: string,
  suburbs: string[],
  maxConcurrency: number
): Promise<any[]> {
  const allResults: any[] = [];
  const allPromises: Promise<void>[] = [];
  let activeCount = 0;
  let nextIndex = 0;

  return new Promise<void>((resolve, reject) => {
    function runNextActor() {
      // Start new actors while we haven't reached maxConcurrency and there are suburbs left
      while (activeCount < maxConcurrency && nextIndex < suburbs.length) {
        let suburb = suburbs[nextIndex++];
        activeCount++;

        // Append ", Australia" to the suburb
        suburb = `${suburb}, Australia`;

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

// Function to sanitize filenames
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

// Function to parse address into components
function parseAddress(address: string) {
  const regex = /^(.+?),\s*([^,]+)\s+(\w{2,3})\s+(\d{4}),\s*Australia$/;
  const match = address.match(regex);
  if (match) {
    return {
      streetAddress: match[1].trim(),
      suburb: match[2].trim(),
      postcode: match[4].trim(),
    };
  } else {
    return {
      streetAddress: "",
      suburb: "",
      postcode: "",
    };
  }
}

// Function to generate CSV file from JSON data
async function generateCSVFile(
  businessType: string,
  location: string,
  data: any[]
) {
  if (data.length === 0) {
    console.log("No leads were found. Try changing locations or business type.");
    // Delete or clear csvFileInfo.json to prevent using old CSV files
    const csvFileInfoPath = path.join(
      process.cwd(),
      "public",
      "csv",
      "csvFileInfo.json"
    );
    if (fs.existsSync(csvFileInfoPath)) {
      fs.unlinkSync(csvFileInfoPath); // Delete the file
    }
    return "No leads were found. Try changing locations or business type.";
  }

  const createCsvWriter = require("csv-writer").createObjectCsvWriter;

  // Sanitize business type and location for filename
  const sanitizedBusinessType = sanitizeFilename(businessType);
  const sanitizedLocation = sanitizeFilename(location);

  // Prepare the CSV filename
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace(/[:.]/g, "-");
  const filename = `${sanitizedBusinessType}_${sanitizedLocation}_${timestamp}.csv`;

  // Define the CSV file path in public/csv/
  const filepath = path.join(process.cwd(), "public", "csv", filename);

  // Ensure the 'public/csv' directory exists
  fs.mkdirSync(path.dirname(filepath), { recursive: true });

  // Define the CSV columns
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: "title", title: "Job Title" },
      { id: "first_name", title: "First Name" },
      { id: "last_name", title: "Last Name" },
      { id: "personal_email", title: "Personal Email Address" },
      { id: "company_email", title: "Company Email Address" },
      { id: "phone_number", title: "Phone Number" },
      { id: "linkedin", title: "LinkedIn" },
      { id: "website", title: "Website" },
      { id: "company_name", title: "Company Name" },
      { id: "street_address", title: "Street No and Name" },
      { id: "address_suburb", title: "Address Suburb" },
      { id: "address_postcode", title: "Address Postcode" },
      { id: "postal_address", title: "Postal Address" },
      { id: "postal_suburb", title: "Postal Suburb" },
      { id: "postal_postcode", title: "Postal PostCode" },
      { id: "country", title: "Country" },
    ],
  });

  // Map the JSON data to CSV data
  const csvData = data.map((item) => {
    const addressParts = parseAddress(item.address || "");

    return {
      title: item.title || "",
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      personal_email: item.company_personal_email || "",
      company_email: item.company_general_email || "",
      phone_number: item.company_phone || "",
      linkedin: item.linkedin_url || "",
      website: item.website || "",
      company_name: item.company_name || "",
      street_address: addressParts.streetAddress || "",
      address_suburb: addressParts.suburb || "",
      address_postcode: addressParts.postcode || "",
      postal_address: addressParts.streetAddress || "",
      postal_suburb: addressParts.suburb || "",
      postal_postcode: addressParts.postcode || "",
      country: "Australia",
    };
  });

  // Write the CSV file
  await csvWriter.writeRecords(csvData);

  console.log(`CSV file saved to ${filepath}`);

  // Calculate the file size
  const stats = fs.statSync(filepath);
  const fileSizeInBytes = stats.size;

  // Only save csvFileInfo.json if the file size is greater than zero
  if (fileSizeInBytes > 0) {
    // Save the file information to a JSON file for later use
    saveToFile("csvFileInfo.json", {
      filename,
      filepath,
      fileSizeInBytes,
    });
  } else {
    // Delete or clear csvFileInfo.json to prevent using old CSV files
    const csvFileInfoPath = path.join(
      process.cwd(),
      "public",
      "csv",
      "csvFileInfo.json"
    );
    if (fs.existsSync(csvFileInfoPath)) {
      fs.unlinkSync(csvFileInfoPath); // Delete the file
    }
    console.log("CSV file is empty. No data was written.");
    return "No leads were found. Try changing locations or business type.";
  }
}

// Function to filter large companies using Perplexity and remove them from savedData
async function filterLargeCompanies(companies: any[]): Promise<string[]> {
  // Prepare the company list with IDs
  const companyList = companies
    .map((company) => `${company.id}: ${company.company_name}`)
    .join("\n");

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${
        process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || ""
      }`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-huge-128k-online",
      messages: [
        {
          role: "system",
          content:
            "Imagine you are a small business broker. You get a list of companies to cold email. But some of the companies in the list are big companies, franchises etc that a small business broker shouldn't waste time emailing. I want you to identify if there are any of those kind of companies and if there are then mention them in your output. You must refer to them using their ID in the output. Don't mention other companies.",
        },
        {
          role: "user",
          content: companyList,
        },
      ],
      temperature: 0.2,
      top_p: 0.9,
      return_citations: false,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1,
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0].message.content;

    console.log("Perplexity Output:", messageContent);

    // Now process messageContent with ChatGPT to extract IDs
    const largeCompanyIds = await extractLargeCompanyIds(messageContent);

    return largeCompanyIds;
  } catch (err) {
    console.error("Error fetching Perplexity output:", err);
    throw err;
  }
}

// Function to extract large company IDs from Perplexity output using ChatGPT
async function extractLargeCompanyIds(
  perplexityOutput: string
): Promise<string[]> {
  const LargeCompaniesSchema = z.object({
    ids: z.array(z.string()),
  });

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "Extract the IDs of the large companies mentioned in the text. Provide the IDs in a JSON format with key 'ids', which is an array of strings.",
      },
      {
        role: "user",
        content: perplexityOutput,
      },
    ],
    response_format: zodResponseFormat(
      LargeCompaniesSchema,
      "large_companies"
    ),
  });

  const result = completion.choices[0].message.parsed;

  if (result && result.ids) {
    return result.ids;
  } else {
    console.error("Failed to extract large company IDs from GPT response.");
    return [];
  }
}

// Function to extract emails from text
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
  let emails: string[] = text.match(emailRegex) || [];

  // Blacklist certain file extensions to filter out false positives
  const blacklistedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".svg",
    ".gif",
    ".tga",
    ".bmp",
    ".zip",
    ".pdf",
    ".webp",
  ];

  emails = emails.filter((email) => {
    // Convert email and extensions to lowercase for case-insensitive comparison
    const lowerEmail = email.toLowerCase();
    return !blacklistedExtensions.some((ext) => lowerEmail.endsWith(ext));
  });

  return emails;
}

// Function to extract links from HTML
function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  $("a[href]").each((i, elem) => {
    let href = $(elem).attr("href");
    if (href) {
      // Remove URL fragments
      href = href.split("#")[0];
      // Trim whitespace
      href = href.trim();
      // Skip mailto, javascript links, empty or invalid hrefs
      if (
        href.startsWith("mailto:") ||
        href.startsWith("javascript:") ||
        href === "" ||
        href === "/" ||
        href === "https://" ||
        href === "http://" ||
        href === "//"
      ) {
        return;
      }
      // Resolve relative URLs
      try {
        const resolvedUrl = new URL(href, baseUrl).toString();
        // Ensure the link is on the same domain
        if (resolvedUrl.startsWith(baseUrl)) {
          links.push(resolvedUrl);
        }
      } catch (error) {
        // Suppress error logging to prevent terminal clutter
        // You can enable logging by uncommenting the line below
        // console.warn(`Invalid URL encountered: ${href} - ${error.message}`);
        // Skip invalid URLs
      }
    }
  });
  return links;
}

// Function to fetch a page's HTML content
async function fetchPage(pageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EmailScraper/1.0)",
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    // Handle errors silently
    return null;
  }
}

// Function to crawl a website and find emails
async function crawlWebsite(startUrl: string): Promise<string[]> {
  const emailsFound = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [];

  const maxPages = 40;
  let pagesCrawled = 0;
  let emailFound = false;

  const parsedUrl = new URL(startUrl);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // Start with the main page
  queue.push(startUrl);

  // Prepare potential contact page URLs
  const contactPaths = [
    "/contact",
    "/contact-us",
    "/contactus",
    "/about",
    "/about-us",
    "/aboutus",
    "/impressum",
  ];
  for (let path of contactPaths) {
    queue.push(new URL(path, baseUrl).toString());
  }

  while (queue.length > 0 && pagesCrawled < maxPages && !emailFound) {
    const currentUrl = queue.shift();

    if (!currentUrl) continue;

    if (visited.has(currentUrl)) {
      continue;
    }
    visited.add(currentUrl);

    const html = await fetchPage(currentUrl);
    if (!html) {
      continue;
    }
    pagesCrawled++;

    // Extract emails from page
    const emails = extractEmails(html);
    if (emails.length > 0) {
      emails.forEach((email) => emailsFound.add(email));
      emailFound = true;
      break; // Stop crawling this website
    }

    // Extract links from page
    const links = extractLinks(html, baseUrl);
    for (let link of links) {
      if (!visited.has(link)) {
        queue.push(link);
      }
    }
  }

  return Array.from(emailsFound);
}

// Main function to generate leads and handle location check + suburbs listing
export async function generateLeads(
  businessType: string,
  location: string
): Promise<string> {
  try {
    const locationCheckResult = await checkLocation(location);
    console.log("Location check result:", locationCheckResult);

    let uniqueResults;

    if (locationCheckResult === "yes") {
      console.log("Broad location detected, fetching list of suburbs...");
      const unstructuredSuburbs = await listSuburbs(location);
      console.log("Suburbs list retrieved:", unstructuredSuburbs);
      const structuredSuburbs = await extractSuburbs(unstructuredSuburbs);
      console.log("Structured Suburb List:", structuredSuburbs);

      // Run a pool of 7 actors at a time and collect results
      const allResults = await runActorPool(
        businessType,
        structuredSuburbs,
        7
      );

      // Remove duplicates from the combined results
      uniqueResults = removeDuplicates(allResults);
    } else {
      console.log("Specific location detected, scraping Google Maps...");
      const results = await scrapeGoogleMaps(businessType, location);

      // Remove duplicates in case of single-location scraping
      uniqueResults = removeDuplicates(results);
    }

    // Save final results to JSON file
    saveToFile("finalResults.json", uniqueResults);

    // Read saved JSON file and assign IDs to each company
    let savedData: any[] = readJsonFromFile("finalResults.json");

    // Check if no leads were found after initial scraping
    if (savedData.length === 0) {
      console.log("No leads were found. Try changing locations or business type.");
      // Delete or clear csvFileInfo.json to prevent using old CSV files
      const csvFileInfoPath = path.join(
        process.cwd(),
        "public",
        "csv",
        "csvFileInfo.json"
      );
      if (fs.existsSync(csvFileInfoPath)) {
        fs.unlinkSync(csvFileInfoPath); // Delete the file
      }
      return "No leads were found. Try changing locations or business type.";
    }

    // Assign an id to each company
    for (let i = 0; i < savedData.length; i++) {
      // Generate an id (not too short)
      savedData[i].id = `company_${i}_${Date.now()}`;
    }

    // Save updated savedData back to finalResults.json
    saveToFile("finalResults.json", savedData);

    // New Step: Filter large companies using Perplexity
    console.log("Filtering large companies using Perplexity...");
    const batchSize = 30;
    const largeCompanyIds = new Set<string>(); // Use a Set to store unique IDs

    for (let i = 0; i < savedData.length; i += batchSize) {
      const batch = savedData.slice(i, i + batchSize);
      const ids = await filterLargeCompanies(batch);
      ids.forEach((id) => largeCompanyIds.add(id));
    }

    // Now, remove the companies with IDs in largeCompanyIds from savedData
    savedData = savedData.filter((company) => !largeCompanyIds.has(company.id));

    // Save the updated savedData back to finalResults.json
    saveToFile("finalResults.json", savedData);

    // Proceed with the rest of the lead generation process using the filtered savedData

    const highestRolePersons: {
      id: string;
      title: string;
      domain: string;
      companyIndex: number;
    }[] = [];

    let domainsBatch: string[] = [];
    let domainToCompanyIndex: { [domain: string]: number } = {};

    for (let index = 0; index < savedData.length; index++) {
      const company = savedData[index];
      if (company.website) {
        const websiteDomain = new URL(company.website)
          .hostname.toLowerCase()
          .replace(/^www\./, "");
        domainsBatch.push(websiteDomain);
        domainToCompanyIndex[websiteDomain] = index;

        // When we have collected enough domains, process them
        if (domainsBatch.length === 10) {
          const highestRolePersonsBatch = await getHighestRolePerson(
            domainsBatch
          );

          highestRolePersonsBatch.forEach((person) => {
            const normalizedDomain = person.domain.toLowerCase();
            const companyIndex = domainToCompanyIndex[normalizedDomain];

            if (companyIndex === undefined) {
              console.error(
                `Company index not found for domain ${normalizedDomain}`
              );
            } else {
              highestRolePersons.push({ ...person, companyIndex });
            }
          });

          // Clear the domainsBatch and domainToCompanyIndex
          domainsBatch = [];
          domainToCompanyIndex = {};

          // When we have collected 10 highest role persons, enrich them
          if (highestRolePersons.length >= 10) {
            await enrichHighestRolePersons(highestRolePersons, savedData);
            highestRolePersons.length = 0; // Reset the array
          }
        }
      }
    }

    // Process any remaining domains
    if (domainsBatch.length > 0) {
      const highestRolePersonsBatch = await getHighestRolePerson(domainsBatch);

      highestRolePersonsBatch.forEach((person) => {
        const companyIndex = domainToCompanyIndex[person.domain];
        highestRolePersons.push({ ...person, companyIndex });
      });
    }

    // Enrich any remaining highest role persons
    if (highestRolePersons.length > 0) {
      await enrichHighestRolePersons(highestRolePersons, savedData);
    }

    // Save the updated savedData back to finalResults.json
    saveToFile("finalResults.json", savedData);

    // --- New Step: Find company emails for companies without email ---

    // Identify companies without both personal and general emails and with website
    const companiesWithoutEmail = [];

    for (let index = 0; index < savedData.length; index++) {
      const company = savedData[index];
      if (
        (!company.company_personal_email ||
          company.company_personal_email.trim() === "") &&
        (!company.company_general_email ||
          company.company_general_email.trim() === "") &&
        company.website
      ) {
        const websiteDomain = new URL(company.website)
          .hostname.replace(/^www\./, "");
        companiesWithoutEmail.push({
          index,
          website: company.website,
          domain: websiteDomain,
        });
      }
    }

    // Proceed to process companies without email if any
    if (companiesWithoutEmail.length > 0) {
      console.log("Running email scraper for companies without email...");

      const limit = pLimit(5); // Limit concurrency to 5

      const crawlPromises = companiesWithoutEmail.map((company) =>
        limit(async () => {
          const emails = await crawlWebsite(company.website);
          if (emails.length > 0) {
            // Update the company in savedData
            const companyIndex = company.index;
            const companyInSavedData = savedData[companyIndex];
            if (
              !companyInSavedData.company_general_email ||
              companyInSavedData.company_general_email.trim() === ""
            ) {
              companyInSavedData.company_general_email = emails[0]; // Take the first email
              console.log(
                `Added general email to company at index ${companyIndex}: ${companyInSavedData.company_general_email}`
              );
            }
          } else {
            console.log(`No emails found for website: ${company.website}`);
          }
        })
      );

      await Promise.all(crawlPromises);

      // Save the updated savedData back to finalResults.json
      saveToFile("finalResults.json", savedData);
    } else {
      console.log("No companies without email found.");
    }

    // Generate the CSV file regardless of whether companies without email were found
    const csvResult = await generateCSVFile(businessType, location, savedData);

    if (
      csvResult === "No leads were found. Try changing locations or business type."
    ) {
      return csvResult;
    }

    return `Lead generation completed. Final results saved with ${savedData.length} unique businesses.`;
  } catch (error) {
    console.error("Error in the lead generation process:", error);
    return "Lead generation failed";
  }
}
