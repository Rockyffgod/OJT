import { useTrans } from '../i18n';
import { MessageSquare, Construction } from 'lucide-react';

export default function MessagesPage() {
  const { t, isNp } = useTrans();

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          {isNp ? 'सन्देशहरू चाँडै आउँदैछ' : 'Messages — Coming Soon'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          {isNp
            ? 'हामी संवाद सुविधामा काम गरिरहेका छौं। चाँडै नै तपाईं सेवा प्रदायकहरूसँग सीधै कुराकानी गर्न सक्नुहुनेछ।'
            : 'We\'re building a real-time messaging experience. Soon you\'ll be able to chat directly with service providers right here.'}
        </p>
      </div>
    </div>
  );
}
