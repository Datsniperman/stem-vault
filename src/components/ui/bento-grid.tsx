import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  badge,
  footer,
  onClick,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rare-card group p-6 flex flex-col justify-between overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {header && <div className="mb-4">{header}</div>}

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          {icon && <div className="text-neutral-400 group-hover:text-white transition-colors">{icon}</div>}
          {badge && <div>{badge}</div>}
        </div>

        {title && (
          <div className="font-semibold text-base text-white group-hover:text-neutral-100 transition-colors">
            {title}
          </div>
        )}

        {description && (
          <div className="text-xs text-neutral-400 leading-relaxed">
            {description}
          </div>
        )}
      </div>

      {footer && <div className="mt-4 pt-4 border-t border-white/[0.06]">{footer}</div>}
    </div>
  );
}
