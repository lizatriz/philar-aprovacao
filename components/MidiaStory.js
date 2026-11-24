'use client';

import { useState } from 'react';

// Visual de story: tela de celular, barrinhas no topo, toque nas laterais para passar.
export default function MidiaStory({ midias }) {
  const [atual, setAtual] = useState(0);
  const total = midias.length;
  const m = midias[atual];

  return (
    <div className="story">
      {total > 1 && (
        <div className="story-barras">
          {midias.map((_, i) => (
            <span key={i} className={i <= atual ? 'cheia' : ''} />
          ))}
        </div>
      )}

      {!m ? (
        <div className="sem-midia">Sem mídia</div>
      ) : !m.url ? (
        <div className="sem-midia">Arquivo indisponível</div>
      ) : m.tipo === 'video' ? (
        <video key={atual} src={m.url} controls playsInline preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={atual} src={m.url} alt={`Story ${atual + 1}`} />
      )}

      {atual > 0 && (
        <button className="story-toque esq" onClick={() => setAtual(atual - 1)} aria-label="Story anterior">
          <span>‹</span>
        </button>
      )}
      {atual < total - 1 && (
        <button className="story-toque dir" onClick={() => setAtual(atual + 1)} aria-label="Próximo story">
          <span>›</span>
        </button>
      )}
      {total > 1 && <span className="contador">{atual + 1}/{total}</span>}
    </div>
  );
}
