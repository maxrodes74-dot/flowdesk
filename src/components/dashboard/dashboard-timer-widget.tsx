"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Play, Pause, RotateCcw } from "lucide-react";

export function DashboardTimerWidget() {
  const { state, dispatch } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedClient, setSelectedClient] = useState("");

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleQuickSave = () => {
    if (!selectedClient || elapsed === 0) return;

    const timeEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      freelancerId: state.freelancer?.id || "",
      clientId: selectedClient,
      date: new Date().toISOString().split("T")[0],
      durationMinutes: Math.round(elapsed / 60),
      description: "Quick timer entry",
      milestoneId: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: "ADD_TIME_ENTRY",
      payload: timeEntry,
    });

    setElapsed(0);
    setSelectedClient("");
    setIsRunning(false);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Timer</h3>
        <Link
          href="/dashboard/time-tracking"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {/* Timer Display */}
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-4xl font-bold text-gray-900 font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {elapsed === 0 ? "Ready to start" : `${elapsed} seconds elapsed`}
          </p>
        </div>

        {/* Client Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Client
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Choose a client...</option>
            {state.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              isRunning
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Stop
              </>
            ) : (
              <>
                <Play size={16} /> Start
              </>
            )}
          </button>
          <button
            onClick={() => {
              setElapsed(0);
              setIsRunning(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Quick Save */}
        {elapsed > 0 && selectedClient && (
          <button
            onClick={handleQuickSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Save Entry
          </button>
        )}

        {/* Link to full timer */}
        <Link
          href="/dashboard/time-tracking"
          className="block w-full px-4 py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Full Timer & Analytics
        </Link>
      </div>
    </div>
  );
}
