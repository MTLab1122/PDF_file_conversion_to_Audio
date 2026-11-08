import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { VoiceSelector } from "../components/VoiceSelector";

describe("VoiceSelector Component", () => {
  it("renders voices and language selection", () => {
    const handleVoiceChange = vi.fn();
    const handleSpeedChange = vi.fn();

    render(
      <VoiceSelector
        selectedVoiceId="en-US-ChristopherNeural"
        onVoiceChange={handleVoiceChange}
        speed={1.0}
        onSpeedChange={handleSpeedChange}
      />
    );

    expect(screen.getByText(/Target Language/i)).toBeInTheDocument();
    expect(screen.getByText(/Neural Voice Character/i)).toBeInTheDocument();
    expect(screen.getByText(/Christopher/i)).toBeInTheDocument();
  });

  it("handles voice selection when a card is clicked", () => {
    const handleVoiceChange = vi.fn();
    const handleSpeedChange = vi.fn();

    render(
      <VoiceSelector
        selectedVoiceId="en-US-ChristopherNeural"
        onVoiceChange={handleVoiceChange}
        speed={1.0}
        onSpeedChange={handleSpeedChange}
      />
    );

    const jennyCard = screen.getByText(/Jenny/i);
    fireEvent.click(jennyCard);

    expect(handleVoiceChange).toHaveBeenCalledWith(
      expect.stringContaining("Jenny")
    );
  });

  it("changes speed when preset button is clicked", () => {
    const handleVoiceChange = vi.fn();
    const handleSpeedChange = vi.fn();

    render(
      <VoiceSelector
        selectedVoiceId="en-US-ChristopherNeural"
        onVoiceChange={handleVoiceChange}
        speed={1.0}
        onSpeedChange={handleSpeedChange}
      />
    );

    const preset15 = screen.getByText("1.5x");
    fireEvent.click(preset15);

    expect(handleSpeedChange).toHaveBeenCalledWith(1.5);
  });
});

