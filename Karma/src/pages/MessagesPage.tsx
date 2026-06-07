import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';

export default function MessagesPage() {
  const { profile, djangoToken } = useAuthStore();
  const { t, isNp } = useTrans();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Bookings from Django REST API
  useEffect(() => {
    if (!djangoToken) {
      setLoading(false);
      return;
    }
    const fetchBookings = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/bookings/`,
          {
            headers: {
              'Authorization': `Bearer ${djangoToken}`,
            },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const list = data.results || data || [];
          setBookings(list);
        }
      } catch (e) {
        console.error('Failed to fetch bookings:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [djangoToken]);

  // Poll for Messages from Django REST API every 2 seconds
  useEffect(() => {
    if (!selected || !djangoToken) return;

    const fetchMessages = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/messages/?booking=${selected}`,
          {
            headers: {
              'Authorization': `Bearer ${djangoToken}`,
            },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const list = data.results || data || [];
          setMessages((prev) => {
            // Check if lists are identical to prevent unnecessary renders & scroll resets
            if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
            return list;
          });
        }
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, [selected, djangoToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send Message to Django REST API
  const send = async () => {
    if (!text.trim() || !selected || sending || !djangoToken) return;
    setSending(true);
    const textToSend = text;
    setText('');
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/messages/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djangoToken}`,
          },
          body: JSON.stringify({
            booking: selected,
            text: textToSend,
          }),
        }
      );
      if (resp.ok) {
        const newMessage = await resp.json();
        setMessages((prev) => [...prev, newMessage]);
      } else {
        console.error('Send failed with status:', resp.status);
      }
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Booking list */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">
          {t('nav.bookings')}
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
            {t('dashboard.noBookings')}
          </p>
        ) : (
          bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-700 transition-smooth ${
                selected === b.id
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <p className="font-medium truncate">{b.job_description?.substring(0, 30) || 'Booking'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.status}</p>
            </button>
          ))
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col min-w-0">
        {selected ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  No messages yet
                </div>
              ) : (
                messages.map((m) => {
                  const mine = (m.sender_id || m.sender) === profile?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                          mine
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <p>{m.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${mine ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={isNp ? 'सन्देश लेख्नुहोस्...' : 'Type a message...'}
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50"
              >
                <Send size={14} />
                {isNp ? 'पठाउनुहोस्' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            {isNp ? 'बुकिङ चयन गर्नुहोस्' : 'Select a booking to start chatting'}
          </div>
        )}
      </div>
    </div>
  );
}
