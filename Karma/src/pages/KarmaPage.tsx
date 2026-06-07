import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTrans } from '../i18n';
import type { KarmaLevel } from '../lib/supabase';

const LEVEL_COLORS: Record<KarmaLevel, string> = {
  NONE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  BRONZE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SILVER: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  GOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PLATINUM: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const STATIC_KARMA = [
  { id: 'demo-k1', profession: 'Electrician', karma_points: 2450, karma_level: 'PLATINUM' as KarmaLevel, average_rating: 4.9, profiles: { full_name: 'Ram Bahadur Thapa', avatar_url: null } },
  { id: 'demo-k2', profession: 'Home Cleaning', karma_points: 1890, karma_level: 'GOLD' as KarmaLevel, average_rating: 4.9, profiles: { full_name: 'Sita Gurung', avatar_url: null } },
  { id: 'demo-k3', profession: 'Plumber', karma_points: 1340, karma_level: 'GOLD' as KarmaLevel, average_rating: 4.7, profiles: { full_name: 'Bikash Shrestha', avatar_url: null } },
  { id: 'demo-k4', profession: 'Painter', karma_points: 870, karma_level: 'SILVER' as KarmaLevel, average_rating: 4.6, profiles: { full_name: 'Anita Maharjan', avatar_url: null } },
  { id: 'demo-k5', profession: 'Carpenter', karma_points: 620, karma_level: 'SILVER' as KarmaLevel, average_rating: 4.5, profiles: { full_name: 'Prakash Tamang', avatar_url: null } },
  { id: 'demo-k6', profession: 'AC Repair', karma_points: 410, karma_level: 'BRONZE' as KarmaLevel, average_rating: 4.8, profiles: { full_name: 'Sunita Rai', avatar_url: null } },
];

export default function KarmaPage() {
  const { t, isNp } = useTrans();
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    const fetchKarma = async () => {
      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select('*, profiles:profiles!service_providers_user_id_fkey(full_name, avatar_url)')
          .order('karma_points', { ascending: false })
          .limit(50);
        if (error) throw error;
        setProviders(data && data.length > 0 ? data : STATIC_KARMA);
      } catch (err) {
        setProviders(STATIC_KARMA);
      }
    };
    fetchKarma();
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
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {p.profiles?.full_name || `Provider #${p.id?.substring(0, 6)}`}
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
                          LEVEL_COLORS[(p.karma_level as KarmaLevel) || 'NONE']
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
