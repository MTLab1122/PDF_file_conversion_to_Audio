import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { UploadZone } from "../components/UploadZone";

describe("UploadZone Component", () => {
  it("renders upload zone with drag and drop prompt", () => {
    const handleSuccess = vi.fn();
    render(<UploadZone onUploadSuccess={handleSuccess} />);

    expect(screen.getByText(/Upload your PDF document/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop or click to browse files/i)).toBeInTheDocument();
    expect(screen.getByText(/Format: PDF only/i)).toBeInTheDocument();
  });

  it("rejects files exceeding maximum allowed size", async () => {
    const handleSuccess = vi.fn();
    // 100 bytes limit
    render(<UploadZone onUploadSuccess={handleSuccess} maxSizeBytes={100} />);

    const oversizedFile = new File([new ArrayBuffer(200)], "large.pdf", {
      type: "application/pdf",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [oversizedFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/exceeds maximum allowed size/i)).toBeInTheDocument();
    });
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    const handleSuccess = vi.fn();
    render(<UploadZone onUploadSuccess={handleSuccess} />);

    const emptyFile = new File([], "empty.pdf", {
      type: "application/pdf",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [emptyFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/The uploaded file is empty/i)).toBeInTheDocument();
    });
    expect(handleSuccess).not.toHaveBeenCalled();
  });
});

