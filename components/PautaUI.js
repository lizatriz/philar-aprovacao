'use client';

import { useEffect, useState } from 'react';
import { FORMATOS_PAUTA, STATUS_PAUTA, APROVACAO_COPY, corPilar } from '@/lib/pautas';
import { formatarData, formatarHora } from '@/lib/formatos';

// Peças visuais das pautas, usadas pela equipe e pelo cliente.

export function Modal({ children, aoFechar }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [aoFechar]);
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog">
        <button className="modal-fechar" onClick={aoFechar} aria-label="Fechar">×</button>
        {children}
      </div>
    </div>
  );
}

export function Copiar({ texto, rotulo = 'Copiar', className = 'btn claro mini' }) {
  const [ok, setOk] = useState(false);
  if (!texto) return null;
  return (
    <button
      type="button" className={className}
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(texto);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? 'Copiado!' : rotulo}
    </button>
  );
}

// Etiquetas do card: pilar, objetivo, formato + data, status, aprovação
export function Etiquetas({ pauta, mostrarStatus = true, mostrarAprovacao = false }) {
  const f = FORMATOS_PAUTA[pauta.formato] || FORMATOS_PAUTA.carrossel;
  return (
    <div className="tags">
      {pauta.pilar && <span className={`tag pilar ${corPilar(pauta.pilar)}`}>{pauta.pilar}</span>}
      {pauta.objetivo && <span className="tag objetivo">{pauta.objetivo}</span>}
      <span className="tag neutra">{f.nome}{pauta.data ? ` · ${formatarData(pauta.data)}` : ''}</span>
      {mostrarStatus && <span className={`tag pill ${pauta.status}`}>{STATUS_PAUTA[pauta.status]}</span>}
      {mostrarAprovacao && <span className={`tag aprov ${pauta.aprovacao}`}>{APROVACAO_COPY[pauta.aprovacao]}</span>}
    </div>
  );
}

export function CardPauta({ pauta, aoAbrir, mostrarStatus, mostrarAprovacao }) {
  const previa = pauta.blocos?.find((b) => b) || pauta.legenda || '';
  return (
    <button className="card-pauta" onClick={aoAbrir}>
      <h3>{pauta.titulo}</h3>
      {previa
        ? <p className="card-previa">{previa}</p>
        : <p className="card-previa vazia">Sem texto ainda</p>}
      <Etiquetas pauta={pauta} mostrarStatus={mostrarStatus} mostrarAprovacao={mostrarAprovacao} />
      {pauta.comentarios?.length > 0 && <span className="card-coment">💬 {pauta.comentarios.length}</span>}
    </button>
  );
}

export function textoCompleto(p) {
  const f = FORMATOS_PAUTA[p.formato] || FORMATOS_PAUTA.carrossel;
  const partes = [p.titulo];
  (p.blocos || []).forEach((b, i) => { if (b) partes.push(`${f.bloco} ${i + 1}:\n${b}`); });
  if (p.legenda) partes.push(`Legenda:\n${p.legenda}`);
  if (p.notas) partes.push(`Notas para o design:\n${p.notas}`);
  return partes.join('\n\n');
}

// O texto da pauta: slides/cenas/telas + legenda (+ notas, só para a equipe)
export function ConteudoPauta({ pauta, comCopiar = true, mostrarNotas = true }) {
  const f = FORMATOS_PAUTA[pauta.formato] || FORMATOS_PAUTA.carrossel;
  const blocos = (pauta.blocos || []).filter((b) => b);
  return (
    <>
      {blocos.length > 0 && (
        <div className="blocos-ver">
          {pauta.blocos.map((b, i) => b && (
            <div key={i} className="bloco-ver">
              <div className="bloco-cab">
                <b>{f.bloco} {i + 1}</b>
                {comCopiar && <Copiar texto={b} />}
              </div>
              <p>{b}</p>
            </div>
          ))}
        </div>
      )}
      {pauta.legenda && (
        <div className="bloco-ver destaque">
          <div className="bloco-cab"><b>Legenda</b>{comCopiar && <Copiar texto={pauta.legenda} />}</div>
          <p>{pauta.legenda}</p>
        </div>
      )}
      {mostrarNotas && pauta.notas && (
        <div className="bloco-ver notas">
          <div className="bloco-cab"><b>Notas para o design</b></div>
          <p>{pauta.notas}</p>
        </div>
      )}
      {!blocos.length && !pauta.legenda && !(mostrarNotas && pauta.notas) && (
        <p className="sub">Esta pauta ainda não tem texto.</p>
      )}
    </>
  );
}

export function Comentarios({ comentarios, souCliente, aoEnviar, pendente }) {
  const [texto, setTexto] = useState('');
  return (
    <div className="comentarios" style={{ marginTop: 16 }}>
      <label>Comentários</label>
      {comentarios.length === 0 && <p className="sub" style={{ fontSize: 13, margin: '0 0 8px' }}>Nenhum comentário ainda.</p>}
      {comentarios.map((c) => (
        <div key={c.id} className={`comentario ${c.autor}`}>
          <b>
            {c.autor === 'philar'
              ? (!souCliente && c.membro?.nome ? `Philar · ${c.membro.nome.split(' ')[0]}` : 'Philar')
              : souCliente ? 'Você' : 'Cliente'}
          </b>
          <small>{formatarHora(c.criado_em)}</small>
          <p>{c.texto}</p>
        </div>
      ))}
      <div className="novo-coment">
        <textarea placeholder="Escreva um comentário…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button
          className="btn mini" disabled={pendente || !texto.trim()}
          onClick={async () => { await aoEnviar(texto); setTexto(''); }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
