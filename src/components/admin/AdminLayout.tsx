import SideNav from './SideNav';
import type { StaffRole } from '../../types';
import './AdminLayout.css';

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  role: StaffRole;
  onLogout: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminLayout({ title, subtitle, role, onLogout, headerExtra, children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <SideNav role={role} onLogout={onLogout} />
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-info">
            <h1 className="admin-title">{title}</h1>
            {subtitle && <p className="admin-subtitle">{subtitle}</p>}
          </div>
          {headerExtra && <div className="admin-header-extra">{headerExtra}</div>}
        </header>
        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}
