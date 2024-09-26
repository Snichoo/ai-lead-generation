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
import LoadingScreen from "@/components/custom-ui/loading-screen";

const formSchema = z.object({
  businessType: z.string().nonempty("Business type is required"),
  location: z.string().nonempty("Location is required"),
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
      const result = await generateLeads(values.businessType, values.location);
      setSuccessMessage(result);
    } catch (error) {
      console.error("Error generating leads:", error);
      setSuccessMessage("An error occurred while generating leads.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-8"> {/* Ensure full width */}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <Card className="w-full max-w-3xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold mb-4">Generate Leads</CardTitle>
            <CardDescription className="text-xl mb-6">
              Specify business type and location. Limit: 800 leads per generation. Refine filters if expecting to exceed this.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-6 text-green-600 text-xl font-semibold text-center">{successMessage}</div>
            )}
            <form className="space-y-8" onSubmit={form.handleSubmit(handleSubmit)}>
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
                <p className="text-red-500 text-base">{form.formState.errors.businessType?.message}</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="location" className="text-lg">
                  Location
                </Label>
                <Input
                  {...form.register("location")}
                  id="location"
                  placeholder="Enter business location"
                  className="text-lg p-6"
                />
                <p className="text-red-500 text-base">{form.formState.errors.location?.message}</p>
              </div>

              <Button type="submit" className="w-full text-xl py-6">
                Generate Leads
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
