"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  businessType: z.string().nonempty("Business type is required"),
  location: z.string().nonempty("Location is required"),
});

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      await generateLeads(values.businessType, values.location);
      // Redirect to /dashboard/download after success
      router.push("/dashboard/download");
      // No need to set isLoading to false here
    } catch (error) {
      console.error("Error generating leads:", error);
      // Redirect to /dashboard/download with error message
      router.push(
        `/dashboard/download?error=${encodeURIComponent(
          "An error occurred while generating leads."
        )}`
      );
      // No need to set isLoading to false here either
    }
    // Remove the setIsLoading(false); from the finally block
  };

  return (
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
                <Input
                  {...form.register("location")}
                  id="location"
                  placeholder="Enter business location"
                  className="text-lg p-6"
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
  );
}
