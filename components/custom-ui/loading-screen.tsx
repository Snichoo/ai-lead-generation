import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="max-w-3xl w-full p-12 text-center bg-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold mb-8">Generating Leads</h2>
        <div className="animate-pulse mb-12">
          <Loader2 className="h-24 w-24 text-primary mx-auto animate-spin" />
        </div>
        <p className="text-xl text-muted-foreground mb-10">
          This process may take several minutes depending on the amount of leads scraped. Thank you for your patience.
        </p>
        <div className="bg-destructive/10 text-destructive p-8 rounded-xl">
          <p className="font-semibold text-2xl mb-4">Important:</p>
          <p className="text-lg">Do not close this window, otherwise your lead generation will terminate.</p>
        </div>
      </div>
    </div>
  )
}