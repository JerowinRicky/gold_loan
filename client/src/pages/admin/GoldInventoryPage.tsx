import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import {
  Gem,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';

export const GoldInventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('ALL');
  const [itemType, setItemType] = useState<string>('ALL');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gold/inventory', {
        params: { search, status, itemType, limit: 50 },
      });
      if (res.data?.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [status, itemType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const totalNetGoldWeight = items.reduce(
    (acc, i) => acc + (Number(i.netWeight) || 0),
    0
  );
  const totalAssessedValue = items.reduce(
    (acc, i) => acc + (Number(i.estimatedValue) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Pledged Gold Collateral Inventory
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Physical jewelry stock held under secure custody in the shop's safe deposit vault
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xs text-charcoal-secondary block">Total Vault Weight:</span>
            <span className="text-xs font-mono font-bold text-charcoal">
              {totalNetGoldWeight.toFixed(2)} grams
            </span>
          </div>
          <div className="text-right pl-3 border-l border-[#DDD5C8]">
            <span className="text-2xs text-charcoal-secondary block">Total Vault Valuation:</span>
            <span className="text-xs font-bold text-emerald-800">
              {formatCurrency(totalAssessedValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-compact bg-[#FBF8F3] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
            <input
              type="text"
              placeholder="Search by ornament, purity, customer, or loan ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-charcoal-secondary" />
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Categories</option>
            <option value="Gold Chain">Gold Chains</option>
            <option value="Gold Ring">Gold Rings</option>
            <option value="Gold Bangles">Gold Bangles</option>
            <option value="Gold Necklace">Gold Necklaces</option>
            <option value="Gold Coins">Gold Bullion Coins</option>
            <option value="Gold Bracelet">Gold Bracelets</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Vault Status</option>
            <option value="PLEDGED">In Vault (Pledged)</option>
            <option value="RELEASED">Released to Customer</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setItemType('ALL');
              fetchInventory();
            }}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Gold Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full text-center py-8 text-charcoal-secondary text-xs">
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
            Inspecting inventory vault...
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="card-compact flex flex-col justify-between gap-2.5 hover:shadow-md transition-shadow"
            >
              <div>
                {/* Photo & Category */}
                <div className="flex items-start gap-2.5">
                  <div className="w-14 h-14 rounded border border-[#DDD5C8] bg-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0].fileUrl}
                        alt={item.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gem className="w-6 h-6 text-amber-700/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-charcoal truncate block">
                        {item.itemType}
                      </span>
                      <span
                        className={`badge ${
                          item.status === 'RELEASED' ? 'badge-active' : 'badge-pending'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className="text-2xs text-charcoal-secondary line-clamp-2">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* Weights & Purity Specs */}
                <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-[#DDD5C8]/60 text-2xs font-mono">
                  <div>
                    <span className="text-charcoal-muted block">Gross Wt:</span>
                    <span className="font-medium">{formatWeight(item.grossWeight)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Net Gold:</span>
                    <span className="font-bold text-charcoal">{formatWeight(item.netWeight)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Purity:</span>
                    <span className="font-semibold text-amber-800">{item.purity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-[#DDD5C8]/40 text-2xs">
                  <div>
                    <span className="text-charcoal-muted block">Assessed Value:</span>
                    <span className="font-semibold">{formatCurrency(item.estimatedValue)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Loan Given:</span>
                    <span className="font-bold text-ferrari">{formatCurrency(item.loanValue)}</span>
                  </div>
                </div>
              </div>

              {/* Loan Reference & Link */}
              <div className="pt-2 border-t border-[#DDD5C8]/60 flex items-center justify-between text-2xs">
                <div>
                  <span className="text-charcoal-muted block">Account:</span>
                  <span className="font-mono font-bold text-charcoal">
                    {item.loan?.loanNumber}
                  </span>
                  <span className="text-charcoal-secondary block text-2xs">
                    {item.loan?.customer?.name}
                  </span>
                </div>

                <Link
                  to={`/admin/loans/${item.loan?.id}`}
                  className="btn-secondary text-2xs py-0.5 px-2 font-semibold"
                >
                  <ExternalLink className="w-3 h-3 text-ferrari" />
                  Loan File
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-charcoal-secondary text-2xs">
            No gold inventory items matching your filter.
          </div>
        )}
      </div>
    </div>
  );
};

