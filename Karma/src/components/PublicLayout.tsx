import { Outlet } from 'react-router-dom';
import Layout from './Layout';

export default function PublicLayout({ children }: { children?: React.ReactNode }) {
  return <Layout>{children || <Outlet />}</Layout>;
}
