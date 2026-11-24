'use client';

import { useState } from 'react';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const chave = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Calendario({ posts, aoEscolher }) {
  // Abre no mês do próximo post pendente (ou no mês atual)
  const [mes, setMes] = useState(() => {
    const prox = posts.find((p) => p.status !== 'aprovado' && p.data_publicacao);
    const base = prox ? new Date(prox.data_publicacao + 'T12:00') : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const porDia = {};
  posts.forEach((p) => { if (p.data_publicacao) (porDia[p.data_publicacao] ||= []).push(p); });

  const inicio = new Date(mes);
  inicio.setDate(1 - mes.getDay());
  const dias = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
  // Esconde a última semana se ela for toda do mês seguinte
  const visiveis = dias[35].getMonth() !== mes.getMonth() ? dias.slice(0, 35) : dias;
  const hoje = chave(new Date());
  const semData = posts.filter((p) => !p.data_publicacao);

  const mudar = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));

  return (
    <div className="cal">
      <div className="cal-cab">
        <button className="btn claro mini" onClick={() => mudar(-1)} aria-label="Mês anterior">‹</button>
        <h2>{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <button className="btn claro mini" onClick={() => mudar(1)} aria-label="Próximo mês">›</button>
      </div>
      <div className="cal-grade">
        {DIAS.map((d) => <div key={d} className="cal-dsem">{d}</div>)}
        {visiveis.map((d) => {
          const k = chave(d);
          return (
            <div key={k} className={`cal-dia${d.getMonth() !== mes.getMonth() ? ' fora' : ''}${k === hoje ? ' hoje' : ''}`}>
              <div className="cal-num">{d.getDate()}</div>
              {(porDia[k] || []).map((p) => (
                <button key={p.id} className={`cal-item ${p.status}`} title={p.titulo} onClick={() => aoEscolher(p.id)}>
                  {p.titulo}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      {semData.length > 0 && (
        <p className="sem-data">
          Sem data definida:{' '}
          {semData.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <a href={`#post-${p.id}`} onClick={(e) => { e.preventDefault(); aoEscolher(p.id); }}>{p.titulo}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
