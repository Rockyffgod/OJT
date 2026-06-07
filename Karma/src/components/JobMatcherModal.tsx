import { useState } from 'react';
import { X, Sparkles, Search, MapPin, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';

interface JobMatcherModalProps {
  onClose: () => void;
}

export default function JobMatcherModal({ onClose }: JobMatcherModalProps) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data: any = await api.post('/api/ai/match-job/', { query });
      setResult(data);
    } catch (err: any) {
      console.error('AI match failed:', err);
      toast.error(err?.message || 'AI service unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 relative max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-smooth"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={22} className="text-violet-600 dark:text-violet-400" />
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
            AI Job Matcher
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Describe what you need — AI will find the right service provider for you.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Need a plumber to fix a broken pipe in Kathmandu, urgent"
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-smooth disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? 'Searching' : 'Find'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI is analyzing your request...
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-100 dark:border-violet-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-sm">
                AI Analysis
              </h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Profession</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {result.profession || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Location</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {result.location || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Urgency</span>
                  <p
                    className={`font-medium ${
                      result.urgency === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : result.urgency === 'medium'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {result.urgency || '—'}
                  </p>
                </div>
              </div>
              {result.description && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                  {result.description}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Matched Providers ({result.matched_providers?.length || 0})
              </h3>
              {!result.matched_providers?.length ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 text-center border border-slate-200 dark:border-slate-700">
                  <MapPin size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No providers found for this area yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.matched_providers.map((p: any) => (
                    <Link
                      key={p.id}
                      to={`/providers/${p.id}`}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-smooth"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {p.profession} • {p.service_area}
                        </p>
                      </div>
                      <div className="text-right text-sm flex-shrink-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {p.hourly_rate ? `NPR ${p.hourly_rate}/hr` : '—'}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 justify-end">
                          <Star size={11} fill="currentColor" />{' '}
                          {p.average_rating?.toFixed(1) || 'New'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
