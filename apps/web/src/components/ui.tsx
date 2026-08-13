import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export function Button({ className, variant = 'primary', size = 'md', loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return <button className={cn('button', `button-${variant}`, `button-${size}`, className)} disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle size={16} className="spin" />}{children}</button>;
}

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('card', className)} {...props}>{children}</div>; }

export function ProgressBar({ value, color = 'var(--primary)' }: { value: number; color?: string }) { return <div className="progress-track" aria-label={`${Math.round(value)}% hoàn thành`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>; }

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'red' | 'orange' | 'green' | 'purple' }) { return <span className={`badge badge-${tone}`}>{children}</span>; }

export function Skeleton({ className = '' }: { className?: string }) { return <div className={cn('skeleton', className)} aria-hidden="true" />; }

export function EmptyState({ icon = '◌', title, description, action }: { icon?: string; title: string; description: string; action?: ReactNode }) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{description}</p>{action}</div>; }

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
