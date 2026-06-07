import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <h1 className="text-6xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-3">404</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Page not found</p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-smooth"
      >
        Go Home
      </Link>
    </div>
  );
}
