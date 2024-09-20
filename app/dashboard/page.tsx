"use client";

import { useState } from "react";
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
import { SubmitForm, scrapeWebsites } from "@/components/form/actions";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react"
import { inputSchema } from "@/lib/zodSchemas";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: inputSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submission = await SubmitForm(undefined, formData);

    if (submission.status === "success") {
      setIsLoading(true);
      const businessType = formData.get("businessType") as string;
      const location = formData.get("location") as string;
      await scrapeWebsites(businessType, location);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Scraping Websites...</h2>
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-7">Generate Leads</h1>
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
            id={form.id} 
            onSubmit={handleSubmit}
          >
            <div className="grid gap-2">
              <Label htmlFor="business-type">Business Type</Label>
              <Input 
                key={fields.businessType.key}
                name={fields.businessType.name}
                defaultValue={fields.businessType.initialValue}
                id="business-type" 
                placeholder="Enter business type" 
              />
              <p className="text-red-500 text-sm">{fields.businessType.errors}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                key={fields.location.key}
                name={fields.location.name}
                defaultValue={fields.location.initialValue}
                id="location" 
                placeholder="Enter business location" 
              />
              <p className="text-red-500 text-sm">{fields.location.errors}</p>
            </div>
            <Button type="submit" className="w-full">
              Generate Leads
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}