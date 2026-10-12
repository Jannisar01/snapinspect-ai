
import React, { useId } from 'react';
import { Loader2 } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost', 
  isLoading?: boolean,
  ariaLabel?: string 
}> = ({ 
  className = '', 
  variant = 'primary', 
  isLoading = false,
  ariaLabel,
  children, 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px]";
  
  const variants = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm border border-[#2563EB] focus-visible:ring-4 focus-visible:ring-[#93C5FD]",
    secondary: "bg-[#EEF2F6] text-[#2563EB] border border-[#E5E7EB] hover:bg-[#E5E7EB] focus-visible:ring-4 focus-visible:ring-[#93C5FD]",
    danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-[#DC2626] shadow-sm focus-visible:ring-4 focus-visible:ring-red-200",
    outline: "border-2 border-[#E5E7EB] text-[#4B5563] hover:border-[#2563EB] hover:text-[#2563EB] bg-transparent focus-visible:ring-4 focus-visible:ring-[#93C5FD]",
    ghost: "text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#2563EB] bg-transparent"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, theme?: 'light' | 'dark' }> = ({ label, theme = 'light', className = '', ...props }) => {
  const id = useId();
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-[#4B5563]'}`}
        >
          {label}
        </label>
      )}
      <input 
        id={id}
        className={`w-full rounded-lg border p-3 text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-[#93C5FD] focus:outline-none transition-all ${
          theme === 'dark' 
            ? 'bg-[#1F2937] border-[#4B5563] text-white placeholder-[#9CA3AF]' 
            : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] shadow-sm'
        } ${className}`} 
        {...props} 
      />
    </div>
  );
};

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string, theme?: 'light' | 'dark' }> = ({ label, theme = 'light', className = '', ...props }) => {
  const id = useId();
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id}
          className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-[#4B5563]'}`}
        >
          {label}
        </label>
      )}
      <textarea 
        id={id}
        className={`w-full rounded-lg border p-3 text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-[#93C5FD] focus:outline-none transition-all ${
          theme === 'dark' 
            ? 'bg-[#1F2937] border-[#4B5563] text-white placeholder-[#9CA3AF]' 
            : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] shadow-sm'
        } ${className}`} 
        {...props} 
      />
    </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: string[] }> = ({ label, options, className = '', ...props }) => {
  const id = useId();
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id}
          className="block text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select 
          id={id}
          className={`w-full rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] p-3 text-sm focus:border-[#2563EB] focus:ring-4 focus:ring-[#93C5FD] focus:outline-none appearance-none cursor-pointer shadow-sm ${className}`} 
          {...props}
        >
          <option value="" disabled>Select Option...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string }> = ({ children, className = '', title }) => (
  <section className={`bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden ${className}`}>
    {title && (
      <header className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7FA] flex items-center">
        <div className="h-5 w-1.2 bg-[#2563EB] mr-4 rounded-full"></div>
        <h2 className="font-oswald font-bold text-xl text-[#1F2937] uppercase tracking-wide">{title}</h2>
      </header>
    )}
    <div className="p-6">{children}</div>
  </section>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: 'blue' | 'red' | 'yellow' | 'green' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    blue: "bg-[#EEF2F6] text-[#2563EB] border-[#93C5FD]/30",
    red: "bg-red-50 text-[#DC2626] border-red-200",
    yellow: "bg-amber-50 text-[#D97706] border-amber-200",
    green: "bg-emerald-50 text-[#059669] border-emerald-200",
    gray: "bg-[#F5F7FA] text-[#4B5563] border-[#E5E7EB]"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};
