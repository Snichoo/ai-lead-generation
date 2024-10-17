"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import AsyncSelect from "react-select/async";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingScreen from "@/components/custom-ui/loading-screen";

// Define the type for your options
type LocationOption = {
  label: string;
  value: string;
};

export const maxDuration = 300;

const parsedMaxLeadCount = Number(process.env.NEXT_PUBLIC_MAX_LEAD_COUNT);
const MAX_LEAD_COUNT =
  !isNaN(parsedMaxLeadCount) && parsedMaxLeadCount > 0
    ? parsedMaxLeadCount
    : 1000; // Default to 1000 if the env variable is invalid

const formSchema = z.object({
  businessType: z.string().nonempty("Business type is required"),
  location: z
    .object({
      label: z.string(),
      value: z.string(),
    })
    .nullable()
    .refine((val) => val !== null, {
      message: "Location is required",
    }),
  leadCount: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() === "") {
        return undefined; // Treat empty string as undefined
      }
      if (typeof val === "string") {
        const parsed = Number(val);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    },
    z
      .number()
      .min(1)
      .max(MAX_LEAD_COUNT)
      .optional()
  ),
});

function useLoadGoogleMapsAPI(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.onload = () => {
        setIsLoaded(true);
      };
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setIsLoaded(true);
    }
  }, [apiKey]);

  return isLoaded;
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isGoogleMapsAPILoaded = useLoadGoogleMapsAPI(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
      location: null as any,
      leadCount: undefined,
    },
  });

  // Custom locations with optional suffix ", NSW"
  const customLocations: LocationOption[] = [
    { label: "Capital Country, ACT/NSW", value: "capital_country_act_nsw" },
    { label: "Blue Mountains, NSW", value: "blue_mountains_nsw" },
    { label: "Central Coast, NSW", value: "central_coast_nsw" },
    { label: "Central Tablelands, NSW", value: "central_tablelands_nsw" },
    { label: "Central West, NSW", value: "central_west_nsw" },
    { label: "Greater Western Sydney, NSW", value: "greater_western_sydney_nsw" },
    { label: "Far South Coast, NSW", value: "far_south_coast_nsw" },
    // Add more custom locations as needed
  ];

  const loadOptions = (
    inputValue: string,
    callback: (options: LocationOption[]) => void
  ) => {
    if (!isGoogleMapsAPILoaded || !inputValue) {
      return callback([]);
    }

    const service = new (window as any).google.maps.places.AutocompleteService();

    const request = {
      input: inputValue,
      types: ["(regions)"],
    };

    service.getPlacePredictions(request, (predictions: any[], status: any) => {
      if (
        status !== (window as any).google.maps.places.PlacesServiceStatus.OK ||
        !predictions
      ) {
        callback(customLocations);
        return;
      }

      const options = predictions.map((prediction) => ({
        label: prediction.description,
        value: prediction.place_id,
      }));

      const combinedOptions = [...customLocations, ...options];

      callback(combinedOptions);
    });
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    console.log("Submitting data: ", values);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${API_URL}/generate-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType: values.businessType,
          location: values.location?.label || "",
          leadCount: values.leadCount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { filename, fileSizeInBytes } = data;
        router.push(
          `/dashboard/download?filename=${encodeURIComponent(
            filename
          )}&fileSizeInBytes=${fileSizeInBytes}`
        );
      } else {
        const errorMsg = data.error || "Lead generation failed";
        router.push(
          `/dashboard/download?error=${encodeURIComponent(errorMsg)}`
        );
      }
    } catch (error) {
      console.error("Error generating leads:", error);
      router.push(
        `/dashboard/download?error=${encodeURIComponent(
          "An error occurred while generating leads. Please try again."
        )}`
      );
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-8">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <Card className="w-full max-w-3xl shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold mb-4">
                Generate Leads
              </CardTitle>
              <CardDescription className="text-xl mb-6">
                Specify business type, location, and number of leads. Maximum
                limit: {MAX_LEAD_COUNT} leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-8"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <div className="space-y-4">
                  <Label htmlFor="business-type" className="text-lg">
                    Business Type
                  </Label>
                  <Input
                    {...form.register("businessType")}
                    id="business-type"
                    placeholder="Enter business type"
                    className="text-lg p-6"
                  />
                  <p className="text-red-500 text-base">
                    {form.formState.errors.businessType?.message}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="location" className="text-lg">
                    Location
                  </Label>
                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field }) => (
                      <AsyncSelect<LocationOption>
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter business location"
                        isClearable={true}
                        className="text-lg"
                        styles={{
                          control: (provided) => ({
                            ...provided,
                            padding: "0.5rem",
                            borderRadius: "0.375rem",
                          }),
                        }}
                      />
                    )}
                  />
                  <p className="text-red-500 text-base">
                    {form.formState.errors.location?.message}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="lead-count" className="text-lg">
                    Number of Leads to Scrape (Optional, max {MAX_LEAD_COUNT})
                  </Label>

                  <Input
                    {...form.register("leadCount")}
                    id="lead-count"
                    type="number"
                    placeholder="Enter number of leads (leave empty for max)"
                    className="text-lg p-6"
                    min="1"
                    max={MAX_LEAD_COUNT.toString()}
                  />

                  <p className="text-red-500 text-base">
                    {form.formState.errors.leadCount?.message}
                  </p>
                </div>

                <Button type="submit" className="w-full text-xl py-6">
                  Generate Leads
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
