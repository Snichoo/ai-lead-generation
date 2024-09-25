"use client"

import { FileSpreadsheet, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import Confetti from "react-confetti"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CardDemo() {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(true)
  const [fileInfo, setFileInfo] = useState<any>(null)

  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window
    setWindowDimensions({ width, height })

    const timer = setTimeout(() => setShowConfetti(false), 5000) // Stop confetti after 5 seconds

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Fetch file info from API
    async function fetchFileInfo() {
      const response = await fetch('/api/getFileInfo')
      const data = await response.json()
      setFileInfo(data)
    }
    fetchFileInfo()
  }, [])

  const handleDownload = () => {
    window.location.href = '/api/downloadCSV'
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))), 10)
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
        />
      )}
      <h1 className="text-4xl font-bold mb-7">Lead Generation Completed🥳</h1>
      <div className="flex flex-col items-center space-y-4 w-full max-w-[600px]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Download CSV File</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <FileSpreadsheet className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {fileInfo ? fileInfo.filename : 'Loading...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV File • {fileInfo ? formatFileSize(fileInfo.fileSizeInBytes) : 'Loading...'}
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={handleDownload} disabled={!fileInfo}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </CardContent>
        </Card>
        <Link href="/dashboard" passHref>
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
