import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ConversionProgressView } from "../components/ConversionProgressView";

describe("ConversionProgressView Component", () => {
  it("renders pipeline tracking stages and progress percentage", () => {
    const initialData = {
      id: "job-123",
      status: "GENERATING_AUDIO",
      progressPercent: 65,
      stageMessage: "Synthesizing neural audio chunks...",
      totalChunks: 8,
      processedChunks: 5,
    };

    render(
      <ConversionProgressView
        conversionId="job-123"
        initialData={initialData}
      />
    );

    expect(screen.getByText(/Conversion Pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/GENERATING_AUDIO/i)).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 8 chunks processed/i)).toBeInTheDocument();
    expect(screen.getByText(/Neural TTS/i)).toBeInTheDocument();
    expect(screen.getByText(/FFmpeg Assembly/i)).toBeInTheDocument();
  });
});

