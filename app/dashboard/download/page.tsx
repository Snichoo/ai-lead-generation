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
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const urlErrorMessage = searchParams.get("error");

  useEffect(() => {
    if (urlErrorMessage) {
      setErrorMessage(urlErrorMessage);
    }
  }, [urlErrorMessage]);

  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window;
    setWindowDimensions({ width, height });

    const timer = setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!errorMessage) {
      // Fetch file info from API
      const fetchFileInfo = async () => {
        try {
          const response = await fetch("/api/getFileInfo");
          if (!response.ok) {
            // Handle 404
            if (response.status === 404) {
              setErrorMessage('No leads were found. Try changing locations or business type.');
            } else {
              throw new Error("Failed to fetch file info");
            }
          } else {
            const data = await response.json();
            setFileInfo(data);
          }
        } catch (error) {
          console.error("Error fetching file info:", error);
          setErrorMessage('An error occurred while fetching the file info.');
        }
      };
      fetchFileInfo();
    }
  }, [errorMessage]);

  const handleDownload = () => {
    window.location.href = "/api/downloadCSV";
  };

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
            </CardHeader>
            <CardContent className="grid gap-8 p-8">
              <div className="flex items-center space-x-6 rounded-lg border-2 border-blue-200 p-6 bg-blue-50">
                <FileSpreadsheet className="h-16 w-16 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-2xl font-medium truncate mb-2"
                    style={{ lineHeight: "2", letterSpacing: "0.02em" }}
                  >
                    {fileInfo && fileInfo.filename
                      ? fileInfo.filename.length > 52
                        ? `${fileInfo.filename.slice(0, 52)}...`
                        : fileInfo.filename
                      : "Loading..."}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    CSV File •{" "}
                    {fileInfo && fileInfo.fileSizeInBytes
                      ? formatFileSize(fileInfo.fileSizeInBytes)
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
                <Button
                  className="text-lg py-6 px-8"
                  onClick={handleDownload}
                  disabled={!fileInfo || !fileInfo.filename}
                >
                  <Download className="mr-3 h-6 w-6" /> Download
                </Button>
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
