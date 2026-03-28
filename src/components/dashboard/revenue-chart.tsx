"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueData {
  month: string;
  revenue: number;
  invoiced: number;
}

interface ClientRevenueData {
  name: string;
  value: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          name="Revenue (Paid)"
        />
        <Line
          type="monotone"
          dataKey="invoiced"
          stroke="#9333ea"
          name="Invoiced (Pending)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ClientRevenueChart({ data }: { data: ClientRevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar dataKey="value" fill="#2563eb" name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ServiceRevenueData {
  service: string;
  amount: number;
  percentage: number;
}

export function ServiceRevenueChart({ data }: { data: ServiceRevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="service" width={100} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar dataKey="amount" fill="#059669" />
      </BarChart>
    </ResponsiveContainer>
  );
}
