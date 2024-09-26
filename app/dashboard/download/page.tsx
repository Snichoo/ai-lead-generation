"use client"

import { FileSpreadsheet, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import Confetti from "react-confetti"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-8">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
        />
      )}
      <div className="flex flex-col items-center space-y-8 w-full max-w-4xl">
        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold mb-4">Lead Generation Completed 🥳</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 p-8">
            <div className="flex items-center space-x-6 rounded-lg border-2 border-blue-200 p-6 bg-blue-50">
              <FileSpreadsheet className="h-16 w-16 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
              <p className="text-2xl font-medium truncate mb-2" style={{ lineHeight: "1.25", letterSpacing: "0.02em" }}>
                {fileInfo ? fileInfo.filename : 'Loading...'}
              </p>
                <p className="text-lg text-muted-foreground">
                  CSV File • {fileInfo ? formatFileSize(fileInfo.fileSizeInBytes) : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Link href="/dashboard" passHref>
                <Button variant="outline" className="text-lg py-6 px-8">
                  <ArrowLeft className="mr-3 h-6 w-6" /> Return to Dashboard
                </Button>
              </Link>
              <Button className="text-lg py-6 px-8" onClick={handleDownload} disabled={!fileInfo}>
                <Download className="mr-3 h-6 w-6" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}