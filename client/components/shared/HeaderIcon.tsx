import React from 'react';

interface HeaderIconProps {
    icon: React.ComponentType<{
        size?: number;
        className?: string;
        style?: React.CSSProperties;
    }>;
    size?: number;
    className?: string;
}

export function HeaderIcon({ icon: Icon, size = 24, className = '' }: HeaderIconProps) {
    return (
        <Icon
            size={size}
            className={className}
            style={{ width: size, height: size }}
        />
    );
}
