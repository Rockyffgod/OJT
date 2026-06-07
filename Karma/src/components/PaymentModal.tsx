import { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';

interface PaymentModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ booking, onClose, onSuccess }: PaymentModalProps) {
  const toast = useToast();
  const [method, setMethod] = useState<'KHALTI' | 'ESEWA'>('KHALTI');
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);

  const qrImage = method === 'KHALTI' ? '/khalti.jpg' : '/esewa.jpg';

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      await api.post('/api/bookings/pay/', {
        booking_id: booking.id,
        payment_method: method,
      });
      toast.success('Payment successful — karma earned!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Payment failed:', err);
      toast.error(err?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 relative border border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-smooth"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
          Complete Payment
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {booking.job_description?.substring(0, 60)}
          <br />
          Amount:{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            NPR {booking.agreed_price || '—'}
          </span>
        </p>

        {/* Method toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMethod('KHALTI')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-smooth ${
              method === 'KHALTI'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Khalti
          </button>
          <button
            onClick={() => setMethod('ESEWA')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-smooth ${
              method === 'ESEWA'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            eSewa
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 text-center mb-4 border border-slate-200 dark:border-slate-700">
          <img
            src={qrImage}
            alt={`${method} QR`}
            className="w-44 h-44 mx-auto object-contain mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan with {method === 'KHALTI' ? 'Khalti' : 'eSewa'} app to pay
            <br />
            <span className="italic">(we didn't have the budget for a real payment API)*</span>
          </p>
        </div>

        {!paid ? (
          <button
            onClick={() => setPaid(true)}
            className="w-full py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-smooth"
          >
            I have paid via {method}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium justify-center">
              <CheckCircle size={18} />
              Paid via {method}
            </div>
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              {processing ? 'Confirming...' : 'Confirm Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
