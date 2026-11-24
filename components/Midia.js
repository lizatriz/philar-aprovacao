'use client';

import { useRef, useState } from 'react';
import MidiaStory from './MidiaStory';

export default function Midia({ midias, formato }) {
  if (formato === 'stories') return <MidiaStory midias={midias} />;
  return <MidiaCarrossel midias={midias} formato={formato} />;
}

function MidiaCarrossel({ midias, formato }) {
  const trilho = useRef(null);
  const [atual, setAtual] = useState(0);
  const total = midias.length;

  function irPara(i) {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className={`midia ${formato}`}>
      {total === 0 ? (
        <div className="sem-midia">Sem mídia</div>
      ) : (
        <div
          className="trilho"
          ref={trilho}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {midias.map((m, i) =>
            !m.url ? (
              <div key={i} className="sem-midia">Arquivo indisponível</div>
            ) : m.tipo === 'video' ? (
              <video key={i} src={m.url} controls playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={m.url} alt={`Mídia ${i + 1}`} loading="lazy" />
            )
          )}
        </div>
      )}
      {total > 1 && (
        <>
          <span className="contador">{atual + 1}/{total}</span>
          {atual > 0 && <button className="seta esq" onClick={() => irPara(atual - 1)} aria-label="Anterior">‹</button>}
          {atual < total - 1 && <button className="seta dir" onClick={() => irPara(atual + 1)} aria-label="Próxima">›</button>}
        </>
      )}
    </div>
  );
}
