import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, BookOpenCheck, ChevronRight, CircleUserRound, Flame, LayoutDashboard, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Settings, Sparkles, Sun, Trophy, Volume2, X, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { Brand } from './brand';
import { cn } from '../utils/cn';

type NavIcon = LucideIcon;
type NavItem = { label: string; href: string; icon: NavIcon };
const primaryNav: NavItem[] = [
  { label: 'Trang chủ', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Khóa học', href: '/courses', icon: BookOpen },
];
const skillNav: NavItem[] = [
  { label: 'Từ vựng', href: '/vocabulary', icon: BookOpenCheck },
  { label: 'Nghe', href: '/listening', icon: Volume2 },
  { label: 'Nói', href: '/speaking', icon: Sparkles },
  { label: 'Đọc', href: '/reading', icon: BookOpen },
  { label: 'Viết', href: '/writing', icon: PenIcon as unknown as LucideIcon },
];
const exploreNav: NavItem[] = [
  { label: 'HSK', href: '/hsk', icon: Trophy },
  { label: 'Hán tự & Bộ thủ', href: '/characters', icon: HanziIcon as unknown as LucideIcon },
  { label: 'Ngữ pháp', href: '/grammar', icon: GrammarIcon as unknown as LucideIcon },
];
const reviewNav: NavItem[] = [
  { label: 'Ôn tập flashcard', href: '/review', icon: RotateIcon as unknown as LucideIcon },
  { label: 'Thống kê', href: '/statistics', icon: ChartIcon as unknown as LucideIcon },
  { label: 'Bảng xếp hạng', href: '/leaderboard', icon: Trophy },
];

function PenIcon(props: { size?: string | number; strokeWidth?: number }) { return <span className="nav-symbol" {...props}>✎</span>; }
function HanziIcon(props: { size?: string | number; strokeWidth?: number }) { return <span className="nav-symbol hanzi-symbol" {...props}>字</span>; }
function GrammarIcon(props: { size?: string | number; strokeWidth?: number }) { return <span className="nav-symbol" {...props}>文</span>; }
function RotateIcon(props: { size?: string | number; strokeWidth?: number }) { return <span className="nav-symbol" {...props}>↻</span>; }
function ChartIcon(props: { size?: string | number; strokeWidth?: number }) { return <span className="nav-symbol" {...props}>▥</span>; }

function NavigationGroup({ label, items, onNavigate }: { label: string; items: NavItem[]; onNavigate?: () => void }) {
  return <div className="nav-group"><span className="nav-label">{label}</span>{items.map(({ label: itemLabel, href, icon: Icon }) => <NavLink key={href} to={href} onClick={onNavigate} className={({ isActive }) => cn('nav-item', isActive && 'active')}><Icon size={18} strokeWidth={1.9} /><span>{itemLabel}</span></NavLink>)}</div>;
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUiStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.roles.includes('admin');

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }, [theme]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); navigate('/search'); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [navigate]);

  const initials = useMemo(() => user?.name.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase() ?? 'HL', [user?.name]);
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
    <aside className={cn('sidebar', sidebarCollapsed && 'collapsed', mobileOpen && 'mobile-open')}>
      <div className="sidebar-top"><Brand compact={sidebarCollapsed} /><button className="icon-button sidebar-collapse" aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} onClick={toggleSidebar}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><button className="icon-button mobile-close" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <div className="sidebar-scroll"><NavigationGroup label="HỌC TẬP" items={primaryNav} onNavigate={() => setMobileOpen(false)} /><NavigationGroup label="4 KỸ NĂNG" items={skillNav} onNavigate={() => setMobileOpen(false)} /><NavigationGroup label="KHÁM PHÁ" items={exploreNav} onNavigate={() => setMobileOpen(false)} /><NavigationGroup label="TIẾN ĐỘ" items={reviewNav} onNavigate={() => setMobileOpen(false)} />{isAdmin && <div className="nav-group"><span className="nav-label">QUẢN TRỊ</span><NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('nav-item', isActive && 'active')}><Settings size={18} /><span>Admin console</span></NavLink></div>}</div>
      <div className="sidebar-footer"><NavLink to="/settings" className="nav-item"><Settings size={18} /><span>Cài đặt</span></NavLink><button className="nav-item nav-logout" onClick={() => void logout()}><LogOut size={18} /><span>Đăng xuất</span></button></div>
    </aside>
    <div className={cn('shell-main', sidebarCollapsed && 'sidebar-is-collapsed')}>
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="topbar-context"><span className="topbar-kicker">Lộ trình học</span><span className="topbar-title">Tiếp tục tiến bộ mỗi ngày</span></div><div className="topbar-actions"><button className="search-trigger" onClick={() => navigate('/search')}><Search size={17} /><span>Tìm kiếm</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Thông báo" onClick={() => navigate('/notifications')}><Bell size={19} /><span className="notification-dot" /></button><button className="icon-button theme-toggle" aria-label="Đổi giao diện" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><Link to="/profile" className="user-chip"><span className="avatar">{initials}</span><span className="user-chip-name">{user?.name ?? 'Học viên'}</span><ChevronRight size={15} /></Link></div></header>
      <main className="shell-content"><Outlet /></main>
    </div>
    <nav className="bottom-nav"><NavLink to="/dashboard" className={({ isActive }) => cn(isActive && 'active')}><LayoutDashboard size={19} /><span>Home</span></NavLink><NavLink to="/courses" className={({ isActive }) => cn(isActive && 'active')}><BookOpen size={19} /><span>Học</span></NavLink><NavLink to="/review" className={({ isActive }) => cn(isActive && 'active')}><RotateIcon size={20} /><span>Ôn tập</span></NavLink><NavLink to="/statistics" className={({ isActive }) => cn(isActive && 'active')}><ChartIcon size={20} /><span>Stats</span></NavLink><NavLink to="/profile" className={({ isActive }) => cn(isActive && 'active')}><CircleUserRound size={19} /><span>Profile</span></NavLink></nav>
  </div>;
}

export function AuthGate({ children }: { children: React.ReactNode }) { const { user, isBootstrapping } = useAuthStore(); if (isBootstrapping) return <div className="boot-screen"><Brand /><div className="boot-spinner" /><p>Đang mở không gian học của bạn…</p></div>; if (!user) return <NavigateToLogin />; return <>{children}</>; }
function NavigateToLogin() { const location = useLocation(); return <LinkRedirect to={`/login?next=${encodeURIComponent(location.pathname)}`} />; }
function LinkRedirect({ to }: { to: string }) { const navigate = useNavigate(); useEffect(() => { navigate(to, { replace: true }); }, [navigate, to]); return null; }

export function PublicHeader() { const { user } = useAuthStore(); return <header className="public-header"><Brand /><nav className="public-nav"><a href="#skills">4 kỹ năng</a><a href="#roadmap">Lộ trình HSK</a><a href="#courses">Khóa học</a></nav><div className="public-actions">{user ? <Link className="button button-primary button-sm" to="/dashboard">Vào học ngay <ChevronRight size={15} /></Link> : <><Link className="button button-ghost button-sm" to="/login">Đăng nhập</Link><Link className="button button-primary button-sm" to="/register">Bắt đầu miễn phí <ChevronRight size={15} /></Link></>}</div></header>; }

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: React.ReactNode; description?: string; action?: React.ReactNode }) { return <div className="page-header"> <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div>{action}</div>}</div>; }

export function SkillMiniNav({ active }: { active: string }) { return <div className="skill-mini-nav">{skillNav.map(({ label, href, icon: Icon }) => <Link key={href} to={href} className={active === href ? 'active' : ''}><Icon size={16} /><span>{label}</span></Link>)}</div>; }

export function StreakPill() { const { user } = useAuthStore(); return <span className="streak-pill"><Flame size={15} fill="currentColor" /> {user?.streak?.currentStreak ?? 0} ngày</span>; }
