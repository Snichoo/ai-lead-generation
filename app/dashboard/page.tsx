"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateLeads } from "@/components/generation/scraper";
import LoadingScreen from "@/components/custom-ui/loading-screen"; // Import the new LoadingScreen component

const formSchema = z.object({
  businessType: z.string().nonempty("Business type is required"),
  location: z.string().nonempty("Location is required"),
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // State to store success message

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
      location: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    console.log("Submitting data: ", values);

    try {
      const result = await generateLeads(values.businessType, values.location);  // Call generateLeads function
      setSuccessMessage(result);  // Set success message based on the result
    } catch (error) {
      console.error("Error generating leads:", error);
      setSuccessMessage("An error occurred while generating leads.");
    } finally {
      setIsLoading(false);  // Stop loading state after completion
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {isLoading ? (
        <LoadingScreen />  
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-7">Generate Leads</h1>

          {successMessage && (
            <div className="mb-4 text-green-500 text-lg">{successMessage}</div>  // Show success message if present
          )}

          <Card className="mx-auto max-w-sm">
            <CardHeader>
              <CardTitle className="text-xl">Filters</CardTitle>
              <CardDescription>
                Specify business type and location. Limit: 800 leads per generation. Refine filters if expecting to exceed this.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                className="grid gap-4"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <div className="grid gap-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Input
                    {...form.register("businessType")}
                    id="business-type"
                    placeholder="Enter business type"
                  />
                  <p className="text-red-500 text-sm">{form.formState.errors.businessType?.message}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    {...form.register("location")}
                    id="location"
                    placeholder="Enter business location"
                  />
                  <p className="text-red-500 text-sm">{form.formState.errors.location?.message}</p>
                </div>

                <Button type="submit" className="w-full">
                  Generate Leads
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
