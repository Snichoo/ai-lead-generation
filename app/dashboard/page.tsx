"use client"
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

  // Custom locations with correct suffixes
  const customLocations: LocationOption[] = [
    { label: "Sydney NSW, Australia", value: "sydney_nsw" },
    { label: "Melbourne VIC, Australia", value: "melbourne_vic" },
    { label: "Brisbane QLD, Australia", value: "brisbane_qld" },
    { label: "Perth WA, Australia", value: "perth_wa" },
    { label: "Adelaide SA, Australia", value: "adelaide_sa" },
    { label: "Gold Coast QLD, Australia", value: "gold_coast_qld" },
    { label: "Newcastle NSW, Australia", value: "newcastle_nsw" },
    { label: "Canberra ACT, Australia", value: "canberra_act" },
    { label: "Wollongong NSW, Australia", value: "wollongong_nsw" },
    { label: "Geelong VIC, Australia", value: "geelong_vic" },
    { label: "Hobart TAS, Australia", value: "hobart_tas" },
    { label: "Townsville QLD, Australia", value: "townsville_qld" },
    { label: "Cairns QLD, Australia", value: "cairns_qld" },
    { label: "Toowoomba QLD, Australia", value: "toowoomba_qld" },
    { label: "Darwin NT, Australia", value: "darwin_nt" },
    { label: "Ballarat VIC, Australia", value: "ballarat_vic" },
    { label: "Bendigo VIC, Australia", value: "bendigo_vic" },
    { label: "Albury-Wodonga VIC/NSW, Australia", value: "albury_wodonga_vic_nsw" },
    { label: "Launceston TAS, Australia", value: "launceston_tas" },
    { label: "Mackay QLD, Australia", value: "mackay_qld" },
    { label: "Rockhampton QLD, Australia", value: "rockhampton_qld" },
    { label: "Bunbury WA, Australia", value: "bunbury_wa" },
  
    // Added regions
    { label: "Loddon Mallee VIC, Australia", value: "loddon_mallee_vic" },
    { label: "Hume VIC, Australia", value: "hume_vic" },
    { label: "Greater Melbourne VIC, Australia", value: "greater_melbourne_vic" },
    { label: "Grampians VIC, Australia", value: "grampians_vic" },
    { label: "Gippsland VIC, Australia", value: "gippsland_vic" },
    { label: "Barwon South West VIC, Australia", value: "barwon_south_west_vic" },
    { label: "South West Queensland QLD, Australia", value: "south_west_queensland_qld" },
    { label: "Central West Queensland QLD, Australia", value: "central_west_queensland_qld" },
    { label: "Wide Bay–Burnett QLD, Australia", value: "wide_bay_burnett_qld" },
    { label: "South East Queensland QLD, Australia", value: "south_east_queensland_qld" },
    { label: "North Queensland QLD, Australia", value: "north_queensland_qld" },
    { label: "Far North Queensland QLD, Australia", value: "far_north_queensland_qld" },
    { label: "Darling Downs QLD, Australia", value: "darling_downs_qld" },
    { label: "Central Queensland QLD, Australia", value: "central_queensland_qld" },
    { label: "Sunraysia NSW/VIC, Australia", value: "sunraysia_nsw_vic" },
    { label: "South West Slopes NSW, Australia", value: "south_west_slopes_nsw" },
    { label: "Southern Tablelands NSW, Australia", value: "southern_tablelands_nsw" },
    { label: "Southern Highlands NSW, Australia", value: "southern_highlands_nsw" },
    { label: "South Coast NSW, Australia", value: "south_coast_nsw" },
    { label: "Snowy Mountains NSW, Australia", value: "snowy_mountains_nsw" },
    { label: "Sapphire Coast NSW, Australia", value: "sapphire_coast_nsw" },
    { label: "Riverina NSW, Australia", value: "riverina_nsw" },
    { label: "Orana NSW, Australia", value: "orana_nsw" },
    { label: "Northern Tablelands NSW, Australia", value: "northern_tablelands_nsw" },
    { label: "Northern Rivers NSW, Australia", value: "northern_rivers_nsw" },
    { label: "North West Slopes NSW, Australia", value: "north_west_slopes_nsw" },
    { label: "Mid North Coast NSW, Australia", value: "mid_north_coast_nsw" },
    { label: "Murray NSW, Australia", value: "murray_nsw" },
    { label: "New England NSW, Australia", value: "new_england_nsw" },
    { label: "Illawarra NSW, Australia", value: "illawarra_nsw" },
    { label: "Hunter Region NSW, Australia", value: "hunter_region_nsw" },
    { label: "Far West NSW, Australia", value: "far_west_nsw" },
    { label: "Far South Coast NSW, Australia", value: "far_south_coast_nsw" },
    { label: "Central West NSW, Australia", value: "central_west_nsw" },
    { label: "Central Tablelands NSW, Australia", value: "central_tablelands_nsw" },
    { label: "Central Coast NSW, Australia", value: "central_coast_nsw" },
    { label: "Blue Mountains NSW, Australia", value: "blue_mountains_nsw" },
    { label: "Capital Country ACT/NSW, Australia", value: "capital_country_act" },
  
    // Sydney regions
    { label: "Sydney CBD and Inner City NSW, Australia", value: "sydney_cbd_and_innercity_nsw" },
    { label: "Sydney Eastern Suburbs NSW, Australia", value: "sydney_eastern_suburbs_nsw" },
    { label: "Sydney Inner West NSW, Australia", value: "sydney_inner_west_nsw" },
    { label: "Sydney Lower North Shore NSW, Australia", value: "sydney_lower_north_shore_nsw" },
    { label: "Sydney Upper North Shore NSW, Australia", value: "sydney_upper_north_shore_nsw" },
    { label: "Sydney Northern Suburbs NSW, Australia", value: "sydney_northern_suburbs_nsw" },
    { label: "Sydney Northern Beaches NSW, Australia", value: "sydney_northern_beaches_nsw" },
    { label: "Sydney Hills District NSW, Australia", value: "sydney_hills_district_nsw" },
    { label: "Western Sydney NSW, Australia", value: "sydney_western_sydney_nsw" },
    { label: "Sydney South Western Sydney NSW, Australia", value: "sydney_south_western_sydney_nsw" },
    { label: "Sydney Sutherland Shire NSW, Australia", value: "sydney_sutherland_shire_nsw" },
    { label: "Sydney St George NSW, Australia", value: "sydney_st_george_nsw" },
    { label: "Sydney Macarthur Region NSW, Australia", value: "sydney_macarthur_region_nsw" },
    { label: "Sydney Hawkesbury Region NSW, Australia", value: "sydney_hawkesbury_region_nsw" },
    { label: "Sydney Other Suburbs NSW, Australia", value: "sydney_other_suburbs_nsw" },
  
    // Melbourne regions
    { label: "Melbourne Inner City VIC, Australia", value: "melbourne_inner_city_vic" },
    { label: "Melbourne Northern Suburbs VIC, Australia", value: "melbourne_northern_suburbs_vic" },
    { label: "Melbourne Eastern Suburbs VIC, Australia", value: "melbourne_eastern_suburbs_vic" },
    { label: "Melbourne Southern Suburbs VIC, Australia", value: "melbourne_southern_suburbs_vic" },
    { label: "Melbourne Western Suburbs VIC, Australia", value: "melbourne_western_suburbs_vic" },
    { label: "Melbourne Northern Outer Suburbs VIC, Australia", value: "melbourne_northern_outer_suburbs_vic" },
    { label: "Melbourne Eastern Outer Suburbs VIC, Australia", value: "melbourne_eastern_outer_suburbs_vic" },
  
    // Brisbane regions
    { label: "Brisbane Inner City QLD, Australia", value: "brisbane_inner_city_qld" },
    { label: "Brisbane Northern Suburbs QLD, Australia", value: "brisbane_northern_suburbs_qld" },
    { label: "Brisbane Southern Suburbs QLD, Australia", value: "brisbane_southern_suburbs_qld" },
    { label: "Brisbane Eastern Suburbs QLD, Australia", value: "brisbane_eastern_suburbs_qld" },
    { label: "Brisbane Western Suburbs QLD, Australia", value: "brisbane_western_suburbs_qld" },
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
      let options: LocationOption[] = [];

      if (
        status === (window as any).google.maps.places.PlacesServiceStatus.OK &&
        predictions
      ) {
        options = predictions.map((prediction) => ({
          label: prediction.description,
          value: prediction.place_id,
        }));
      }

      // Filter custom locations based on inputValue
      const filteredCustomLocations = customLocations.filter((location) =>
        location.label.toLowerCase().includes(inputValue.toLowerCase())
      );

      // Combine filtered custom locations with Google predictions
      const combinedOptions = [...filteredCustomLocations, ...options];

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
<div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
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
