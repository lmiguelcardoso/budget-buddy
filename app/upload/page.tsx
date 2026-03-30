import { FileUpload } from "@/components/file-upload";

export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Upload Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a credit card invoice in PDF, PNG, or JPEG format to extract
            transactions automatically.
          </p>
        </div>
        <FileUpload />
      </div>
    </main>
  );
}
