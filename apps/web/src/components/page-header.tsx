import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-normal leading-tight text-[#37322F] font-serif">
          {title}
        </h1>
        {description && (
          <p className="text-[rgba(55,50,47,0.80)] text-sm sm:text-base lg:text-lg font-medium font-sans mt-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto self-start lg:self-center">
          {action}
        </div>
      )}
    </div>
  );
}

