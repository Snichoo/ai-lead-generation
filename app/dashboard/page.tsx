"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { generateLeads } from "@/components/generation/scraper";
import LoadingScreen from "@/components/custom-ui/loading-screen";
import Script from "next/script";
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';


const formSchema = z.object({
  businessType: z.string().nonempty("Business type is required"),
  location: z.object({
    label: z.string(),
    value: z.object({
      place_id: z.string(),
    }),
  }).nullable().refine(val => val !== null, {
    message: "Location is required",
  }),
});

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
      location: null as any, // Allow null for location
    },
  });  

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    console.log("Submitting data: ", values);

    try {
      const result = await generateLeads(values.businessType, values.location?.label || "");
      if (result === "Lead generation failed" || result.startsWith("No leads were found")) {
        router.push(
          `/dashboard/download?error=${encodeURIComponent(result)}`
        );
      } else {
        router.push("/dashboard/download");
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
              Specify business type and location. Limit: 800 leads per
              generation. Refine filters if expecting to exceed this.
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
                    <GooglePlacesAutocomplete
                      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                      selectProps={{
                        value: field.value,
                        onChange: field.onChange,
                        placeholder: "Enter business location",
                        isClearable: true,
                        className: "text-lg",
                        styles: {
                          control: (provided) => ({
                            ...provided,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                          }),
                        },
                      }}
                    />
                  )}
                />
                <p className="text-red-500 text-base">
                  {form.formState.errors.location?.message}
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