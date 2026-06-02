import { forwardRef } from 'react';

const TerminalPanel = forwardRef<HTMLDivElement, any>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`relative bg-[#050505] border border-[#151515] rounded-[4px] p-6 transition-colors duration-200 hover:border-[#262626] ${className}`}
        {...props}
      >
        {/* Top Left Corner */}
        <div className="absolute top-[-1px] left-[-1px] w-[12px] h-[12px] border-t-[1px] border-l-[1px] border-[#3A3A3A] pointer-events-none rounded-tl-[4px]" />
        {/* Top Right Corner */}
        <div className="absolute top-[-1px] right-[-1px] w-[12px] h-[12px] border-t-[1px] border-r-[1px] border-[#3A3A3A] pointer-events-none rounded-tr-[4px]" />
        {/* Bottom Left Corner */}
        <div className="absolute bottom-[-1px] left-[-1px] w-[12px] h-[12px] border-b-[1px] border-l-[1px] border-[#3A3A3A] pointer-events-none rounded-bl-[4px]" />
        {/* Bottom Right Corner */}
        <div className="absolute bottom-[-1px] right-[-1px] w-[12px] h-[12px] border-b-[1px] border-r-[1px] border-[#3A3A3A] pointer-events-none rounded-br-[4px]" />
        
        {children}
      </div>
    );
  }
);

TerminalPanel.displayName = 'TerminalPanel';

export default TerminalPanel;
