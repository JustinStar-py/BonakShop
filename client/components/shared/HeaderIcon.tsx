import React from 'react';

interface HeaderIconProps {
    icon: React.ComponentType<any>;
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
