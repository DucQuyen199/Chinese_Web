import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, Skeleton } from './ui';

export function PageSkeleton() { return <div className="page-stack"><Skeleton className="skeleton-title" /><div className="stats-grid"><Skeleton className="skeleton-card" /><Skeleton className="skeleton-card" /><Skeleton className="skeleton-card" /><Skeleton className="skeleton-card" /></div><Skeleton className="skeleton-panel" /></div>; }

export function ErrorState({ message = 'Không thể tải dữ liệu lúc này.', retry }: { message?: string; retry?: () => void }) { return <Card className="state-card"><AlertCircle size={28} color="var(--danger)" /><h2>Có lỗi xảy ra</h2><p>{message}</p><div className="state-actions">{retry && <Button variant="secondary" onClick={retry}><RefreshCw size={16} /> Thử lại</Button>}<Link className="button button-ghost button-md" to="/dashboard">Về dashboard</Link></div></Card>; }

export function NotFoundPage() { return <main className="center-page"><Card className="state-card"><span className="display-number">404</span><h1>Trang này chưa tồn tại</h1><p>Hãy quay về dashboard để tiếp tục hành trình học.</p><Link className="button button-primary button-md" to="/dashboard"><ArrowLeft size={16} /> Về dashboard</Link></Card></main>; }
