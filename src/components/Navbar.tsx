'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { name: '首页', path: '/' },
        { name: '素材库', path: '/materials' },
        { name: '生成记录', path: '/history' },
    ];

    return (
        <nav className="w-full bg-background border-b border-card-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo / Brand */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-lg font-semibold tracking-wide text-foreground">AI Studio</span>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-8">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={cn(
                                    "text-sm font-medium transition-colors duration-200 relative py-1",
                                    isActive
                                        ? "text-foreground"
                                        : "text-muted hover:text-foreground"
                                )}
                            >
                                {item.name}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile / Extra Actions (Placeholder) */}
                <div className="w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            </div>
        </nav>
    );
}
