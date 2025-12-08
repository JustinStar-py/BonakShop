// FILE: components/admin/PageHeader.tsx
// DESCRIPTION: Modern page header with breadcrumbs and actions

'use client';

import { ChevronLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: { label: string; href?: string }[];
    actions?: ReactNode;
}

export default function PageHeader({
    title,
    description,
    breadcrumbs,
    actions
}: PageHeaderProps) {
    return (
        <div className="space-y-4 mb-8 animate-fadeIn">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-zinc-500">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {crumb.href ? (
                                <a
                                    href={crumb.href}
                                    className="hover:text-primary transition-colors"
                                >
                                    {crumb.label}
                                </a>
                            ) : (
                                <span className="text-zinc-900 font-medium">{crumb.label}</span>
                            )}
                            {index < breadcrumbs.length - 1 && (
                                <ChevronLeft size={14} className="text-zinc-400" />
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Title and Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-zinc-600 text-sm max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex gap-2 flex-wrap">
                        {actions}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
        </div>
    );
}
