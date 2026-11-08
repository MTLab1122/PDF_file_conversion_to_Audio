import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AudioPlayer } from "../components/AudioPlayer";

describe("AudioPlayer Component", () => {
  it("renders audio player with title and download button", () => {
    render(
      <AudioPlayer
        audioId="test-audio-123"
        title="Sample Document Audio"
        initialDuration={125}
        downloadFilename="sample.mp3"
      />
    );

    expect(screen.getByText("Sample Document Audio")).toBeInTheDocument();
    expect(screen.getByText(/Download MP3/i)).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();
    expect(screen.getByTitle("Play")).toBeInTheDocument();
  });
});
