"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
  RevenueChart,
  ClientRevenueChart,
  ServiceRevenueChart,
} from "@/components/dashboard/revenue-chart";

// Mock data generators
function generateMonthlyData() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month, i) => ({
    month,
    revenue: Math.floor(Math.random() * 8000) + 2000,
    invoiced: Math.floor(Math.random() * 5000) + 1000,
  }));
}

function generateClientData(clients: any[]) {
  return clients.slice(0, 5).map((client) => ({
    name: client.name,
    value: Math.floor(Math.random() * 15000) + 2000,
  }));
}

function generateServiceData() {
  return [
    { service: "Web Development", amount: 45000, percentage: 45 },
    { service: "UI/UX Design", amount: 28000, percentage: 28 },
    { service: "Consulting", amount: 18000, percentage: 18 },
    { service: "Other", amount: 9000, percentage: 9 },
  ];
}

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

export default function RevenuePage() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState("12m");

  // Calculate metrics from state
  const totalRevenue = state.invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const pendingRevenue = state.invoices
    .filter((i) => i.status === "sent" || i.status === "viewed")
    .reduce((sum, i) => sum + i.total, 0);

  const totalInvoiced = totalRevenue + pendingRevenue;
  const paidInvoices = state.invoices.filter((i) => i.status === "paid").length;
  const collectionRate =
    state.invoices.length > 0
      ? Math.round((paidInvoices / state.invoices.length) * 100)
      : 0;

  const averageProjectValue =
    state.invoices.length > 0
      ? totalInvoiced / state.invoices.length
      : 0;

  const monthlyData = generateMonthlyData();
  const clientData = generateClientData(state.clients);
  const serviceData = generateServiceData();

  // Calculate funnel data
  const funnelData = [
    {
      stage: "Proposals Sent",
      count: state.proposals.filter((p) => p.status !== "draft").length,
    },
    {
      stage: "Approved",
      count: state.proposals.filter((p) => p.status === "approved").length,
    },
    {
      stage: "In Progress",
      count: state.proposals.filter((p) => p.status === "approved").length,
    },
    {
      stage: "Invoiced",
      count: state.invoices.length,
    },
    {
      stage: "Paid",
      count: state.invoices.filter((i) => i.status === "paid").length,
    },
  ];

  const metrics: MetricCard[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: 12.5,
      icon: <TrendingUp size={24} />,
    },
    {
      label: "Pending Revenue",
      value: formatCurrency(pendingRevenue),
      change: -5.2,
      icon: <TrendingUp size={24} />,
    },
    {
      label: "Average Project Value",
      value: formatCurrency(averageProjectValue),
      change: 8.3,
      icon: <TrendingUp size={24} />,
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      change: 2.1,
      icon: <TrendingUp size={24} />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your income and business metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <TrendingUp size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {metric.value}
                </p>
                <p className={`text-xs mt-1 ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {metric.change >= 0 ? "+" : ""}{metric.change}% vs last period
                </p>
              </div>
              <div className="text-blue-600">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Revenue Trend
        </h2>
        <RevenueChart data={monthlyData} />
      </div>

      {/* Revenue by Client & Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Client
          </h2>
          <ClientRevenueChart data={clientData} />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Service
          </h2>
          <ServiceRevenueChart data={serviceData} />
        </div>
      </div>

      {/* Revenue Funnel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Revenue Pipeline
        </h2>
        <div className="space-y-4">
          {funnelData.map((item, index) => {
            const percentage =
              funnelData[0].count > 0
                ? Math.round((item.count / funnelData[0].count) * 100)
                : 0;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.stage}</p>
                    <p className="text-sm text-gray-600">{item.count} items</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Goal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Revenue Goal
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Goal: {formatCurrency(12000)}
              </p>
              <p className="text-sm text-gray-600">Current: {formatCurrency(totalRevenue)}</p>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {Math.round((totalRevenue / 12000) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${Math.min((totalRevenue / 12000) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
