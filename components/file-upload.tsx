"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function validateClientFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PDF, PNG, and JPEG files are accepted.";
  }
  if (file.size > MAX_SIZE) {
    return "File must be 10 MB or smaller.";
  }
  return null;
}

export function FileUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const selectFile = useCallback((selected: File) => {
    const err = validateClientFile(selected);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(selected);
    setProgress(0);

    if (selected.type !== "application/pdf") {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) selectFile(dropped);
    },
    [selectFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!file) return;

    const apiKey =
      typeof window !== "undefined"
        ? localStorage.getItem("openai_api_key")
        : null;

    if (!apiKey) {
      setError(
        "OpenAI API key not found. Please set it in settings before uploading."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const body = JSON.parse(xhr.responseText);
        router.push(`/invoices/${body.data.id}/review`);
      } else {
        let message = "Upload failed. Please try again.";
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.error) message = body.error;
        } catch {
          // ignore parse error
        }
        setError(message);
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError("Network error. Please check your connection and try again.");
      setUploading(false);
    };

    xhr.open("POST", "/api/invoices");
    xhr.setRequestHeader("X-OpenAI-API-Key", apiKey);
    setUploading(true);
    xhr.send(formData);
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload invoice file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !file)
            inputRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}
          ${file ? "cursor-default" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleInputChange}
        />

        {file ? (
          <div className="flex w-full items-start gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Invoice preview"
                className="h-20 w-20 rounded-md object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileText className="size-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop or{" "}
              <span className="text-primary underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, PNG, JPEG — max 10 MB
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {progress}%
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? `Uploading… ${progress}%` : "Upload Invoice"}
      </Button>
    </div>
  );
}
