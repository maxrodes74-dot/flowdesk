"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { generateId, formatTime } from "@/lib/utils";
import { Play, Pause, RotateCcw, SaveIcon } from "lucide-react";

export function TimerComponent() {
  const { state, dispatch } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSaveTimer = async () => {
    if (!selectedClient || elapsed === 0) return;

    const timeEntry = {
      id: `entry_${generateId()}`,
      freelancerId: state.freelancer?.id || "",
      clientId: selectedClient,
      date: new Date().toISOString().split("T")[0],
      durationMinutes: Math.round(elapsed / 60),
      description,
      milestoneId: selectedMilestone || null,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: "ADD_TIME_ENTRY",
      payload: timeEntry,
    });

    setElapsed(0);
    setSelectedClient("");
    setSelectedMilestone("");
    setDescription("");
    setShowForm(false);
    setIsRunning(false);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timer</h3>

      {!showForm ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900 font-mono">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {elapsed > 0 ? formatTime(Math.round(elapsed / 60)) : "Ready to start"}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause size={18} /> Stop
                </>
              ) : (
                <>
                  <Play size={18} /> Start
                </>
              )}
            </button>
            <button
              onClick={() => {
                setElapsed(0);
                setIsRunning(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={18} /> Reset
            </button>
            {elapsed > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
              >
                <SaveIcon size={18} /> Save
              </button>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTimer();
          }}
          className="space-y-4"
        >
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Duration: {formatTime(Math.round(elapsed / 60))}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client</option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Milestone (Optional)
            </label>
            <select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No milestone</option>
              {state.milestones
                .filter((m) => m.status !== "completed")
                .map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Time Entry
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
