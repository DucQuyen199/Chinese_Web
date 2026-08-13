import { BookOpenText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) { return <Link to="/" className="brand" aria-label="HanLearn trang chủ"><span className="brand-mark"><BookOpenText size={19} strokeWidth={2.4} /></span>{!compact && <span>Han<span>Learn</span></span>}</Link>; }
