import React from 'react';
import { X, Play, ExternalLink } from 'lucide-react';
import { RhythmDefinition } from '../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rhythm: RhythmDefinition;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  rhythm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#14151F] border border-[#2B2E42] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-white space-y-3 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#E84A27]/20 border border-[#E84A27]/40 text-[#FF5533] flex items-center justify-center font-bold text-xs">
              <Play className="w-3.5 h-3.5 fill-current" />
            </span>
            <div>
              <span className="text-[10px] font-brand tracking-widest text-gray-400 uppercase font-semibold block">
                Video Demostrativo PRO · Jordan Migues
              </span>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                {rhythm.shortTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Cerrar video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Video Container (16:9) */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/[0.06] shadow-inner">
          <iframe
            src={rhythm.videoEmbedUrl}
            title={rhythm.shortTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <p className="text-gray-400 text-xs font-sans text-center sm:text-left">
            Demostración técnica oficial del compás, acentuación y postura palmar.
          </p>
          {/* Botón de respaldo para abrir directamente en YouTube */}
          <a
            href={rhythm.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-sans font-medium text-gray-200 hover:text-white transition active:scale-95 shrink-0"
          >
            <span>Abrir directamente en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF5533]" />
          </a>
        </div>
      </div>
    </div>
  );
};
