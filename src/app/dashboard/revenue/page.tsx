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

// Calculate monthly revenue data from invoices
function calculateMonthlyData(invoices: any[]) {
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

  const monthlyRevenue: { [key: number]: number } = {};
  const monthlyInvoiced: { [key: number]: number } = {};

  invoices.forEach((invoice) => {
    const date = new Date(invoice.createdAt);
    const month = date.getMonth();

    if (!monthlyRevenue[month]) monthlyRevenue[month] = 0;
    if (!monthlyInvoiced[month]) monthlyInvoiced[month] = 0;

    if (invoice.status === "paid") {
      monthlyRevenue[month] += invoice.total;
    }
    monthlyInvoiced[month] += invoice.total;
  });

  return months.map((month, i) => ({
    month,
    revenue: monthlyRevenue[i] || 0,
    invoiced: monthlyInvoiced[i] || 0,
  }));
}

// Calculate revenue by client from invoices
function calculateClientData(invoices: any[], clients: any[]) {
  const clientRevenue: { [key: string]: { name: string; value: number } } = {};

  invoices
    .filter((i) => i.status === "paid")
    .forEach((invoice) => {
      if (!clientRevenue[invoice.clientId]) {
        const client = clients.find((c) => c.id === invoice.clientId);
        clientRevenue[invoice.clientId] = {
          name: client?.name || "Unknown Client",
          value: 0,
        };
      }
      clientRevenue[invoice.clientId].value += invoice.total;
    });

  return Object.values(clientRevenue)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

// Calculate revenue by service from invoice line items
function calculateServiceData(invoices: any[]) {
  const serviceRevenue: { [key: string]: number } = {};
  let totalServiceRevenue = 0;

  invoices
    .filter((i) => i.status === "paid")
    .forEach((invoice) => {
      invoice.lineItems.forEach((item: any) => {
        const service = item.description || "Other Services";
        if (!serviceRevenue[service]) {
          serviceRevenue[service] = 0;
        }
        const itemTotal = item.quantity * item.rate;
        serviceRevenue[service] += itemTotal;
        totalServiceRevenue += itemTotal;
      });
    });

  if (totalServiceRevenue === 0) {
    return [];
  }

  return Object.entries(serviceRevenue)
    .map(([service, amount]) => ({
      service,
      amount: amount as number,
      percentage: Math.round(((amount as number) / totalServiceRevenue) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
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

  const monthlyData = calculateMonthlyData(state.invoices);
  const clientData = calculateClientData(state.invoices, state.clients);
  const serviceData = calculateServiceData(state.invoices);

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
        {state.invoices.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No invoice data yet. Create your first invoice to see revenue trends.</p>
          </div>
        ) : (
          <RevenueChart data={monthlyData} />
        )}
      </div>

      {/* Revenue by Client & Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Client
          </h2>
          {clientData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No client revenue data yet. Mark invoices as paid to see breakdown.</p>
            </div>
          ) : (
            <ClientRevenueChart data={clientData} />
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Service
          </h2>
          {serviceData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No service revenue data yet. Create and pay invoices to see breakdown.</p>
            </div>
          ) : (
            <ServiceRevenueChart data={serviceData} />
          )}
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
