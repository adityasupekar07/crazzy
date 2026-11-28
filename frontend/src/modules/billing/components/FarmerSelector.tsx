import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Loader2,
  X,
} from 'lucide-react';
import { QUERY_KEYS } from '../../../queries/keys';
import { billingApi } from '../billing.api';
import { useBillingStore, useBillingSettlementStore } from '../../../store';
import type { BillingFarmerItem } from '../billing.types';

const PAGE_LIMIT = 20;

export const FarmerSelector: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const selectedFarmer = useBillingStore((state) => state.selectedFarmer);
  const setLegacySelectedFarmer = useBillingStore((state) => state.setSelectedFarmer);
  const setSettlementFarmer = useBillingSettlementStore((state) => state.setSelectedFarmer);

  const setSelectedFarmer = (farmer: BillingFarmerItem | null) => {
    setLegacySelectedFarmer(farmer);
    setSettlementFarmer(farmer);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.billing.farmers({
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    queryFn: () =>
      billingApi.getFarmers({
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
  });

  const farmers = data?.farmers || [];
  const pagination = data?.pagination;

  const handleSelect = (farmer: BillingFarmerItem) => {
    if (selectedFarmer?.id === farmer.id) {
      setSelectedFarmer(null);
    } else {
      setSelectedFarmer(farmer);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0052cc]" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Select Farmer
          </span>
          {selectedFarmer && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0052cc] border border-blue-200">
              #{selectedFarmer.code} {selectedFarmer.name}
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                title="Clear selected farmer"
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, mobile, or code..."
            className="w-full light-input rounded-xl text-xs py-2 pl-9 pr-8 bg-white"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* States: Loading / Error / Empty / List */}
      {isLoading ? (
        <div className="py-10 text-center text-xs text-gray-500 border border-gray-200 rounded-xl bg-gray-50/50">
          <Loader2 className="w-6 h-6 animate-spin text-[#0052cc] mx-auto mb-2" />
          <span>Loading farmers...</span>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{(error as any)?.message || 'Failed to load farmers.'}</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg font-bold hover:bg-red-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : farmers.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">No Farmers Found</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {debouncedSearch
              ? `No farmers matched "${debouncedSearch}".`
              : 'No farmers are registered for this dairy yet.'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3.5">Code</th>
                  <th className="py-2.5 px-3.5">Farmer Name</th>
                  <th className="py-2.5 px-3.5">Mobile</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Feed Due</th>
                  <th className="py-2.5 px-3.5 text-right">Advance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {farmers.map((farmer) => {
                  const isSelected = selectedFarmer?.id === farmer.id;
                  const hasFeedDue = Number(farmer.outstandingFeedAmount) > 0;
                  const hasAdvDue = Number(farmer.outstandingAdvanceAmount) > 0;

                  return (
                    <tr
                      key={farmer.id}
                      onClick={() => handleSelect(farmer)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/80 ring-1 ring-inset ring-[#0052cc]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono font-bold text-[#091e42]">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <CheckCircle className="w-3.5 h-3.5 text-[#0052cc] shrink-0" />
                          )}
                          <span>#{farmer.code}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#091e42]">
                        {farmer.name}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {farmer.mobile}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            farmer.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {farmer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-mono font-semibold ${
                          hasFeedDue ? 'text-amber-700' : 'text-gray-400'
                        }`}
                      >
                        ₹{farmer.outstandingFeedAmount}
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-mono font-semibold ${
                          hasAdvDue ? 'text-rose-700' : 'text-gray-400'
                        }`}
                      >
                        ₹{farmer.outstandingAdvanceAmount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          {pagination && (
            <div className="px-3.5 py-2.5 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs text-gray-600">
              <span>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} farmers)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-45 font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-45 font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

