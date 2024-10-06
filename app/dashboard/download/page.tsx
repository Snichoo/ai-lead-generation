"use client";

import { FileSpreadsheet, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ErrorMessage from "@/components/custom-ui/errorMessage";

export default function DownloadPage() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [showConfetti, setShowConfetti] = useState(true);
  const [filename, setFilename] = useState<string | null>(null);
  const [fileSizeInBytes, setFileSizeInBytes] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const urlErrorMessage = searchParams.get("error");
  const urlFilename = searchParams.get("filename");
  const urlFileSizeInBytes = searchParams.get("fileSizeInBytes");

  useEffect(() => {
    if (urlErrorMessage) {
      setErrorMessage(urlErrorMessage);
    } else if (urlFilename && urlFileSizeInBytes) {
      setFilename(urlFilename);
      setFileSizeInBytes(Number(urlFileSizeInBytes));
    } else {
      setErrorMessage('No file information provided.');
    }
  }, [urlErrorMessage, urlFilename, urlFileSizeInBytes]);

  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window;
    setWindowDimensions({ width, height });

    const timer = setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-cloud-run-service-url';
  const downloadUrl = `${API_URL}/download?filename=${encodeURIComponent(filename || '')}`;

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "n/a";
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))), 10);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-8">
      {showConfetti && !errorMessage && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
        />
      )}
      <div className="flex flex-col items-center space-y-8 w-full max-w-4xl">
        {errorMessage && (
          <ErrorMessage message={errorMessage} />
        )}
        {!errorMessage && (
          <Card className="w-full shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold mb-4">
                Lead Generation Completed 🥳
              </CardTitle>
              <CardDescription className="text-xl mb-6">
                Please download the file now, as you won&apos;t be able to return to this page later.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 p-8">
              <div className="flex items-center space-x-6 rounded-lg border-2 border-blue-200 p-6 bg-blue-50">
                <FileSpreadsheet className="h-16 w-16 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-2xl font-medium truncate mb-2"
                    style={{ lineHeight: "1.4", letterSpacing: "0.02em" }}
                  >
                    {filename
                      ? filename.length > 52
                        ? `${filename.slice(0, 52)}...`
                        : filename
                      : "Loading..."}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    CSV File •{" "}
                    {fileSizeInBytes !== null
                      ? formatFileSize(fileSizeInBytes)
                      : "Loading..."}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Link href="/dashboard" passHref>
                  <Button variant="outline" className="text-lg py-6 px-8">
                    <ArrowLeft className="mr-3 h-6 w-6" /> Return to Dashboard
                  </Button>
                </Link>
                {filename && (
                  <a href={downloadUrl}>
                    <Button
                      className="text-lg py-6 px-8"
                      disabled={!filename}
                    >
                      <Download className="mr-3 h-6 w-6" /> Download
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {errorMessage && (
          <div className="flex justify-center">
            <Link href="/dashboard" passHref>
              <Button variant="outline" className="text-lg py-6 px-8">
                <ArrowLeft className="mr-3 h-6 w-6" /> Return to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
