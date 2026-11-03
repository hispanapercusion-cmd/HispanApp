import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { canUseNativeShare, copyShareLink, nativeShare, whatsappShareUrl } from '../services/share';
import { track } from '../services/analytics';
import { useLang } from '../i18n';

/** "Recomienda HispanApp": compartir el enlace de la app (sin ningún código PRO) */
export const ShareCard: React.FC = () => {
  const { L } = useLang();
  const [copied, setCopied] = useState(false);
  const native = canUseNativeShare();

  const onShare = async () => {
    const ok = await nativeShare();
    if (ok) track('share', { method: 'native' });
  };

  const onCopy = async () => {
    if (await copyShareLink()) {
      setCopied(true);
      track('share', { method: 'copy' });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="sub-card sub-card-accent p-4 rounded-2xl space-y-3">
      <div>
        <p className="text-xs font-semibold text-white">🤝 {L('Recomienda HispanApp', 'Recommend HispanApp')}</p>
        <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">
          {L(
            '¿Das clases o tocas en grupo? Compártela con tus alumnos y compañeros: guitarristas, bailaoras, cantaores y percusionistas pueden empezar gratis.',
            'Do you teach or play in a group? Share it with your students and bandmates: guitarists, dancers, singers and percussionists can start for free.'
          )}
        </p>
      </div>

      <div className="flex gap-2">
        {native ? (
          <button
            onClick={onShare}
            className="flex-1 py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{L('Compartir', 'Share')}</span>
          </button>
        ) : (
          <a
            href={whatsappShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('share', { method: 'whatsapp' })}
            className="flex-1 py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{L('Enviar por WhatsApp', 'Send on WhatsApp')}</span>
          </a>
        )}
        <button
          onClick={onCopy}
          className="px-3.5 py-2.5 rounded-xl btn-3d text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          title={L('Copiar el enlace con el mensaje', 'Copy the link with the message')}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? L('Copiado', 'Copied') : L('Copiar', 'Copy')}</span>
        </button>
      </div>

      <p className="text-[10.5px] text-gray-500 leading-snug">
        {L('Se comparte solo el enlace de la app. Tu código o tu clave PRO nunca se incluyen: son personales.', 'Only the app link is shared. Your PRO code or key is never included: it is personal.')}
      </p>
    </div>
  );
};
