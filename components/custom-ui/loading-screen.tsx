import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="max-w-md w-full p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Generating Leads</h2>
        <div className="animate-pulse mb-8">
          <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
        </div>
        <p className="text-muted-foreground mb-6">
          This process may take several minutes depending on the amount of leads scraped. Thank you for your patience.
        </p>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-semibold">Important:</p>
          <p>Do not close this window, otherwise your lead generation will terminate.</p>
        </div>
      </div>
    </div>
  )
}
