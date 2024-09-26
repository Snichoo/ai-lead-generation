import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Alert 
      variant="destructive" 
      className="mb-8 bg-white shadow-lg border-2 border-destructive rounded-lg p-6"
    >
      <div className="flex items-center space-x-4">
        <AlertCircle className="h-8 w-8 flex-shrink-0" />
        <div className="flex-grow">
          <AlertTitle className="text-xl font-semibold mb-2">Error</AlertTitle>
          <AlertDescription className="text-lg">{message}</AlertDescription>
        </div>
      </div>
    </Alert>
  )
}