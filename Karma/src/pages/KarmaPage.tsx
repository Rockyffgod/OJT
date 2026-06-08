import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Star, Award, User } from 'lucide-react';
import { api } from '../lib/api';
import { useTrans } from '../i18n';

const LEVEL_COLORS: Record<string, string> = {
  NONE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  BRONZE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SILVER: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  GOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PLATINUM: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

export default function KarmaPage() {
  const { t, isNp } = useTrans();
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/karma/leaderboard/')
      .then((data: any) => setProviders(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setProviders([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Trophy size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            {t('nav.karma')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isNp ? 'शीर्ष प्रदायकहरू' : 'Top rated providers'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400 w-12">#</th>
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                  {isNp ? 'प्रदायक' : 'Provider'}
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  {isNp ? 'पेशा' : 'Profession'}
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                  {isNp ? 'अंक' : 'Points'}
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                  {isNp ? 'स्तर' : 'Level'}
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  {isNp ? 'रेटिङ' : 'Rating'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    {t('notif.empty')}
                  </td>
                </tr>
              ) : (
                providers.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-4">
                      {i === 0 ? (
                        <Trophy size={18} className="text-yellow-500" />
                      ) : i === 1 ? (
                        <Medal size={18} className="text-slate-400" />
                      ) : i === 2 ? (
                        <Medal size={18} className="text-amber-600" />
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/providers/${p.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0">
                          {p.user_photo ? (
                            <img
                              src={p.user_photo}
                              alt={p.user_name || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={14} className="text-slate-500 dark:text-slate-400" />
                            </div>
                          )}
                        </div>
                        <span>{p.user_name || `Provider #${p.id?.substring(0, 6)}`}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {p.profession || '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {p.karma_points || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          LEVEL_COLORS[p.karma_level || 'NONE']
                        }`}
                      >
                        {p.karma_level || 'NONE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Star size={14} className="fill-current" />
                        {p.average_rating?.toFixed(1) || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
