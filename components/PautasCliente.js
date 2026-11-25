'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { aprovarCopy, pedirAjusteCopy, comentarPautaCliente } from '@/app/pautas-actions';
import { APROVACAO_COPY, ordenarPautas } from '@/lib/pautas';
import { Modal, CardPauta, Etiquetas, ConteudoPauta, Comentarios } from './PautaUI';

const FILTROS = [['pendente', 'Aguardando'], ['ajuste', 'Em ajuste'], ['aprovada', 'Aprovadas'], ['todas', 'Todas']];

export default function PautasCliente({ token, pautas }) {
  const temPendente = pautas.some((p) => p.aprovacao === 'pendente');
  const [filtro, setFiltro] = useState(temPendente ? 'pendente' : 'todas');
  const [abertaId, setAbertaId] = useState(null);
  const aberta = pautas.find((p) => p.id === abertaId);
  const lista = ordenarPautas(pautas).filter((p) => filtro === 'todas' || p.aprovacao === filtro);
  const conta = (f) => (f === 'todas' ? pautas.length : pautas.filter((p) => p.aprovacao === f).length);

  return (
    <div>
      <p className="sub" style={{ marginTop: 0, marginBottom: 16 }}>
        Aqui estão os textos dos próximos conteúdos, antes de irem para o design. Aprovando a copy, a gente já começa a arte.
      </p>
      <div className="barra">
        <div className="abas">
          {FILTROS.map(([v, t]) => (
            <button key={v} className={filtro === v ? 'ativa' : ''} onClick={() => setFiltro(v)}>{t} ({conta(v)})</button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="vazio">{pautas.length === 0 ? 'Nenhuma pauta para revisar por enquanto.' : 'Nada nesta categoria.'}</p>
      ) : (
        <div className="galeria">
          {lista.map((p) => (
            <CardPauta key={p.id} pauta={p} aoAbrir={() => setAbertaId(p.id)} mostrarStatus={false} mostrarAprovacao />
          ))}
        </div>
      )}

      {aberta && (
        <Modal aoFechar={() => setAbertaId(null)}>
          <VerPautaCliente token={token} pauta={aberta} />
        </Modal>
      )}
    </div>
  );
}

function VerPautaCliente({ token, pauta }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [pedindo, setPedindo] = useState(false);
  const [texto, setTexto] = useState('');
  const rodar = (fn) => iniciar(async () => { await fn(); router.refresh(); });

  return (
    <div>
      <h2 style={{ marginBottom: 10, paddingRight: 36 }}>{pauta.titulo}</h2>
      <Etiquetas pauta={pauta} mostrarStatus={false} mostrarAprovacao />

      <div style={{ margin: '16px 0' }}>
        <ConteudoPauta pauta={pauta} comCopiar={false} mostrarNotas={false} />
      </div>

      {pauta.aprovacao !== 'aprovada' && !pedindo && (
        <div className="acoes">
          <button className="btn ok" disabled={pendente} onClick={() => rodar(() => aprovarCopy(token, pauta.id))}>✓ Aprovar copy</button>
          <button className="btn ajuste" disabled={pendente} onClick={() => setPedindo(true)}>Pedir ajuste</button>
        </div>
      )}
      {pauta.aprovacao === 'aprovada' && (
        <p className="sucesso" style={{ fontWeight: 600 }}>✓ Você aprovou esta copy. Ela segue para o design.</p>
      )}
      {pedindo && (
        <div style={{ marginBottom: 12 }}>
          <label>O que você gostaria de ajustar?</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus placeholder="Ex: no slide 2, trocar “palco” por “espetáculo”." />
          <div className="acoes" style={{ marginTop: 8 }}>
            <button
              className="btn ajuste" disabled={pendente || !texto.trim()}
              onClick={() => rodar(async () => { await pedirAjusteCopy(token, pauta.id, texto); setTexto(''); setPedindo(false); })}
            >
              Enviar pedido de ajuste
            </button>
            <button className="btn claro" onClick={() => setPedindo(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <Comentarios
        comentarios={pauta.comentarios || []}
        souCliente
        pendente={pendente}
        aoEnviar={(t) => new Promise((ok) => rodar(async () => { await comentarPautaCliente(token, pauta.id, t); ok(); }))}
      />
      <p className="sub" style={{ fontSize: 12, marginTop: 12 }}>Status: {APROVACAO_COPY[pauta.aprovacao]}</p>
    </div>
  );
}
