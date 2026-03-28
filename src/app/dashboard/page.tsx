"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function DashboardPage() {
  const { state } = useApp();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Calculate stats
  const activeClients = new Set(
    state.proposals.map((p) => p.clientId).concat(state.invoices.map((i) => i.clientId))
  ).size;

  const proposalsSent = state.proposals.filter((p) => p.status !== "draft").length;
  const totalRevenue = state.invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const pendingInvoices = state.invoices.filter(
    (i) => i.status === "sent" || i.status === "viewed"
  ).length;

  const overdueInvoices = state.invoices.filter(
    (i) => i.status === "overdue"
  ).length;

  const proposalsApproved = state.proposals.filter(
    (p) => p.status === "approved"
  ).length;
  const totalProposals = state.proposals.length;
  const approvalRate =
    totalProposals > 0
      ? Math.round((proposalsApproved / totalProposals) * 100)
      : 0;

  const stats: StatCard[] = [
    {
      label: "Active Clients",
      value: activeClients,
      icon: <Users size={24} />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Proposals Sent",
      value: proposalsSent,
      icon: <FileText size={24} />,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: <DollarSign size={24} />,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Pending Invoices",
      value: pendingInvoices,
      icon: <Clock size={24} />,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Overdue Invoices",
      value: overdueInvoices,
      icon: <AlertTriangle size={24} />,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      icon: <TrendingUp size={24} />,
      color: "bg-teal-100 text-teal-700",
    },
  ];

  // Get recent activity
  const recentActivity = [
    ...state.proposals.map((p) => ({
      id: p.id,
      type: "proposal" as const,
      title: p.title,
      clientName: p.clientName,
      status: p.status,
      date: p.createdAt,
      amount: p.totalPrice,
    })),
    ...state.invoices.map((i) => ({
      id: i.id,
      type: "invoice" as const,
      title: `Invoice for ${i.clientName}`,
      clientName: i.clientName,
      status: i.status,
      date: i.createdAt,
      amount: i.total,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {state.freelancer?.name || "Freelancer"}
        </h1>
        <p className="text-gray-600 mt-2">{formattedDate}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={cn("p-3 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <Link
                key={item.id}
                href={
                  item.type === "proposal"
                    ? `/dashboard/proposals/${item.id}`
                    : `/dashboard/invoices/${item.id}`
                }
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.clientName}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getStatusColor(item.status)
                      )}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-600">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/proposals/new"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Proposal
        </Link>
        <Link
          href="/dashboard/invoices/new"
          className="px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          New Invoice
        </Link>
      </div>
    </div>
  );
}
