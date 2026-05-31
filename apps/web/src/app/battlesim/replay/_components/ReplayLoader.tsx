'use client';
import { useState } from "react";
import { ReplayData } from "../../types";

export function ReplayLoader({ onReplayLoad }: { onReplayLoad: (data: ReplayData) => void }) {
  const [replayText, setReplayText] = useState("");
  const [error, setError] = useState("");

  const handleLoadReplay = () => {
    try {
      if (!replayText.trim()) {
        throw new Error("Please paste a valid replay text");
      }

      const mockReplayData: ReplayData = {
        side1: "Player 1",
        side2: "Player 2",
        team1: "",
        team2: "",
        replay: replayText.trim(),
        winner: 0,
        createdAt: new Date().toISOString()
      };

      onReplayLoad(mockReplayData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-surface-800 rounded-lg max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-surface-50">Load Pokémon Showdown Replay</h2>
      
      <div className="w-full mb-4">
        <textarea
          value={replayText}
          onChange={(e) => setReplayText(e.target.value)}
          placeholder="Paste the entire replay text here"
          className="w-full h-64 p-3 border rounded bg-surface-700 text-surface-50 border-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
      </div>
      
      {error && (
        <div className="w-full mb-4 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100">
          {error}
        </div>
      )}
      
      <button
        onClick={handleLoadReplay}
        className="w-full p-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Load Replay
      </button>
      
      <p className="mt-4 text-sm text-surface-300">
        Copy and paste the complete replay text from Pokémon Showdown
      </p>
    </div>
  );
}
