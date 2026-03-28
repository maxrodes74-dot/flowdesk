"use client";

import React from "react";
import Link from "next/link";
import { Users, Plus, ExternalLink } from "lucide-react";
import { useApp } from "@/lib/store";

export default function ClientsPage() {
  const { state } = useApp();

  const getClientStats = (clientId: string) => {
    const proposals = state.proposals.filter((p) => p.clientId === clientId);
    const invoices = state.invoices.filter((i) => i.clientId === clientId);
    return {
      proposalsCount: proposals.length,
      invoicesCount: invoices.length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client relationships and communications
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Client
        </Link>
      </div>

      {/* Clients Table/Cards */}
      {state.clients.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Proposals
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Invoices
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {state.clients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.company}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {stats.proposalsCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {stats.invoicesCount}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-3">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {state.clients.map((client) => {
              const stats = getClientStats(client.id);
              return (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{client.company}</p>
                  <p className="text-sm text-gray-600">{client.email}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-900">
                      <span className="font-semibold">{stats.proposalsCount}</span>{" "}
                      proposals
                    </span>
                    <span className="text-gray-900">
                      <span className="font-semibold">{stats.invoicesCount}</span>{" "}
                      invoices
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">No clients yet</h2>
          <p className="text-gray-600 mt-2">
            Get started by adding your first client
          </p>
          <Link
            href="/dashboard/clients/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Client
          </Link>
        </div>
      )}
    </div>
  );
}
