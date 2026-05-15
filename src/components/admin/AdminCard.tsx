import './AdminCard.css';

interface AdminCardProps {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  dimmed?: boolean;
}

/**
 * Linha visual de uma lista admin (program, location, staff).
 * Layout: titulo + badges no topo, subtitulo abaixo, meta no centro, actions a direita.
 * `dimmed` para itens desativados.
 */
export default function AdminCard({ title, subtitle, badges, meta, actions, dimmed }: AdminCardProps) {
  return (
    <div className={`admin-card${dimmed ? ' is-dimmed' : ''}`}>
      <div className="admin-card-info">
        <div className="admin-card-headline">
          <h3 className="admin-card-title">{title}</h3>
          {badges && <div className="admin-card-badges">{badges}</div>}
        </div>
        {subtitle && <p className="admin-card-subtitle">{subtitle}</p>}
        {meta && <div className="admin-card-meta">{meta}</div>}
      </div>
      {actions && <div className="admin-card-actions">{actions}</div>}
    </div>
  );
}
