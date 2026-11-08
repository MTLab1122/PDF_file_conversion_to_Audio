"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

export interface UploadedDocument {
  id: string;
  originalFilename: string;
  fileSize: number;
  pageCount: number;
  mimeType: string;
}

interface UploadZoneProps {
  onUploadSuccess: (document: UploadedDocument) => void;
  maxSizeBytes?: number; // Defaults to 50MB
  disabled?: boolean;
}

export function UploadZone({
  onUploadSuccess,
  maxSizeBytes = 50 * 1024 * 1024,
  disabled = false,
}: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);

  // Client-side PDF signature check (%PDF-)
  const validatePdfMagicBytes = async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.slice(0, 5).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // '%PDF-' => 0x25, 0x50, 0x44, 0x46, 0x2D
      return (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
      );
    } catch {
      return false;
    }
  };

  const handleUpload = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    // 1. Check size
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File exceeds maximum allowed size of ${formatBytes(maxSizeBytes)}.`
      );
      setSelectedFile(null);
      return;
    }

    if (file.size === 0) {
      setErrorMessage("The uploaded file is empty.");
      setSelectedFile(null);
      return;
    }

    // 2. Validate PDF signature
    const isValidPdf = await validatePdfMagicBytes(file);
    if (!isValidPdf) {
      setErrorMessage(
        "Invalid file format: File header does not match a valid PDF document (%PDF-)."
      );
      setSelectedFile(null);
      return;
    }

    // 3. Perform upload with XMLHttpRequest for real progress
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 90);
        setUploadProgress(Math.min(90, Math.max(10, percent)));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          setUploadedDoc(result.document);
          onUploadSuccess(result.document);
        } catch {
          setErrorMessage("Failed to parse server upload response.");
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          setErrorMessage(
            errRes.error || errRes.message || "Failed to upload document."
          );
        } catch {
          setErrorMessage(`Upload failed with status code ${xhr.status}.`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setErrorMessage("Network error during document upload.");
    };

    xhr.send(formData);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    [maxSizeBytes]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  const handleClear = () => {
    setSelectedFile(null);
    setUploadedDoc(null);
    setErrorMessage(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      {!uploadedDoc ? (
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-border hover:border-indigo-400/80 hover:bg-muted/30"
          } ${disabled || uploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">
              {isDragActive
                ? "Drop the PDF here..."
                : "Upload your PDF document"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to browse files
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">
              Format: PDF only
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">
              Max Size: {formatBytes(maxSizeBytes)}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">
              OCR: Supported
            </span>
          </div>

          {uploading && (
            <div className="mt-6 w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Validating & uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground truncate max-w-sm">
                {uploadedDoc.originalFilename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(uploadedDoc.fileSize)} • {uploadedDoc.pageCount}{" "}
                {uploadedDoc.pageCount === 1 ? "page" : "pages"} verified
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Remove file and select another"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

