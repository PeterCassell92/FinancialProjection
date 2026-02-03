'use client';

import * as React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/redux/hooks';
import { getDateFormatPattern } from '@/lib/utils/date-format';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
}: DatePickerProps) {
  const dateFormat = useAppSelector((state) => state.settings.dateFormat);
  const formatPattern = getDateFormatPattern(dateFormat);

  return (
    <div className={cn('relative', className)}>
      <ReactDatePicker
        selected={value}
        onChange={(date: Date | null) => onChange(date || undefined)}
        dateFormat={formatPattern}
        placeholderText={placeholder}
        disabled={disabled}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        fixedHeight
        isClearable
        popperPlacement="bottom-start"
        customInput={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-muted-foreground',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{value ? format(value, formatPattern) : placeholder}</span>
          </button>
        }
      />
    </div>
  );
}
