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

type CardProps = React.ComponentProps<typeof Card>

export default function CardDemo({ className, ...props }: CardProps) {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window
    setWindowDimensions({ width, height })

    const timer = setTimeout(() => setShowConfetti(false), 5000) // Stop confetti after 5 seconds

    return () => clearTimeout(timer)
  }, [])

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
        <Card className={cn("w-full", className)} {...props}>
          <CardHeader>
            <CardTitle>Download CSV File</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <FileSpreadsheet className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  monthly_report_lead_generation_data_analysis.csv
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV File • 2.5 MB
                </p>
              </div>
            </div>
            <Button className="w-full">
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