import React, { useEffect, useRef, useState } from 'react';

// Ayuda cortita: un botón "i" que, al tocarlo (o pasar el ratón), muestra una frase en un globito.
// Se cierra sola a los pocos segundos o al tocar fuera.
interface HintProps {
  text: string;
  placement?: 'top' | 'bottom';
  align?: 'center' | 'right' | 'left';
  label?: string;
  className?: string;
}

export const Hint: React.FC<HintProps> = ({ text, placement = 'top', align = 'center', label, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 5000);
    const outside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  const pos = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignCls = align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'right' ? 'right-0' : 'left-0';

  return (
    <span
      ref={ref}
      className={`relative inline-flex ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={label || text}
        aria-expanded={open}
        className="w-4 h-4 rounded-full border border-white/25 text-[10px] leading-none font-bold text-gray-300 hover:text-white hover:border-white/50 flex items-center justify-center cursor-pointer"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${pos} ${alignCls} w-52 rounded-xl bg-[#1B1F29] border border-white/[0.12] px-3 py-2 text-[11.5px] leading-snug font-sans font-medium normal-case tracking-normal text-gray-100 shadow-xl text-left whitespace-normal`}
        >
          {text}
        </span>
      )}
    </span>
  );
};
