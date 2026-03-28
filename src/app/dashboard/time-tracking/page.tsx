"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatTime, formatCurrency } from "@/lib/utils";
import { Plus, Clock, Play, Pause, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { TimerComponent } from "@/components/dashboard/timer-component";
import { ManualTimeEntryModal } from "@/components/dashboard/manual-time-entry-modal";
import { BulkInvoiceModal } from "@/components/dashboard/bulk-invoice-modal";

type TimeFilter = "all" | string; // "all" or clientId

export default function TimeTrackingPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set()
  );
  const [showBulkInvoice, setShowBulkInvoice] = useState(false);

  // Get unique clients from time entries
  const clientsWithEntries = useMemo(() => {
    const clientIds = new Set(state.timeEntries.map((e) => e.clientId));
    return Array.from(clientIds)
      .map((clientId) => state.clients.find((c) => c.id === clientId))
      .filter(Boolean);
  }, [state.timeEntries, state.clients]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = state.timeEntries;
    if (filter !== "all") {
      entries = entries.filter((e) => e.clientId === filter);
    }
    return entries.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.timeEntries, filter]);

  // Calculate weekly summary
  const weeklySummary = useMemo(() => {
    const summary: Record<string, { hours: number; client: string }> = {};

    filteredEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      const client = state.clients.find((c) => c.id === entry.clientId);
      const key = `${weekKey}-${entry.clientId}`;

      if (!summary[key]) {
        summary[key] = {
          hours: 0,
          client: client?.name || "Unknown",
        };
      }
      summary[key].hours += entry.durationMinutes / 60;
    });

    return summary;
  }, [filteredEntries, state.clients]);

  const hourlyRate = state.freelancer?.hourlyRate || 50;
  const totalMinutes = filteredEntries.reduce(
    (sum, e) => sum + e.durationMinutes,
    0
  );
  const totalHours = totalMinutes / 60;
  const potentialRevenue = totalHours * hourlyRate;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Manual Entry
          </button>
        </div>

        {/* Timer Component */}
        <div className="mb-8">
          <TimerComponent />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {totalHours.toFixed(1)}h
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Total Minutes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {totalMinutes}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Hourly Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(hourlyRate)}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">
              Potential Revenue
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(potentialRevenue)}
            </p>
          </div>
        </div>

        {/* Filter by Client */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              filter === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            All Clients
          </button>
          {clientsWithEntries.map((client) => (
            <button
              key={client!.id}
              onClick={() => setFilter(client!.id)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                filter === client!.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {client!.name}
            </button>
          ))}
        </div>

        {/* Bulk Invoice Button */}
        {selectedEntries.size > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowBulkInvoice(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Create Invoice from Selected ({selectedEntries.size})
            </button>
          </div>
        )}

        {/* Time Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">
              No time entries yet
            </h2>
            <p className="text-gray-600 mt-2">
              Start tracking your time to see entries here
            </p>
            <button
              onClick={() => setShowManualEntry(true)}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Manual Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  const client = state.clients.find(
                    (c) => c.id === entry.clientId
                  );
                  const milestone = entry.milestoneId
                    ? state.milestones.find((m) => m.id === entry.milestoneId)
                    : null;
                  const isSelected = selectedEntries.has(entry.id);

                  return (
                    <div
                      key={entry.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedEntries);
                            if (e.target.checked) {
                              newSet.add(entry.id);
                            } else {
                              newSet.delete(entry.id);
                            }
                            setSelectedEntries(newSet);
                          }}
                          className="mt-1 w-4 h-4 rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {client?.name || "Unknown Client"}
                            </span>
                            <span className="text-sm font-medium text-gray-600">
                              {formatTime(entry.durationMinutes)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {entry.description}
                          </p>
                          {milestone && (
                            <p className="text-xs text-gray-500 mt-1">
                              Milestone: {milestone.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(
                              (entry.durationMinutes / 60) * hourlyRate
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Summary */}
            {Object.keys(weeklySummary).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Weekly Summary
                </h3>
                <div className="space-y-3">
                  {Object.entries(weeklySummary).map(([key, data]) => (
                    <div key={key} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">{data.client}</p>
                        <p className="text-xs text-gray-500">
                          Week of {key}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {data.hours.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(data.hours * hourlyRate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualTimeEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
      />
      {showBulkInvoice && (
        <BulkInvoiceModal
          isOpen={true}
          selectedEntryIds={Array.from(selectedEntries)}
          onClose={() => {
            setShowBulkInvoice(false);
            setSelectedEntries(new Set());
          }}
        />
      )}
    </div>
  );
}
