'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  salvarPauta, mudarStatusPauta, excluirPauta, moverPauta, comentarPautaEquipe,
} from '@/app/pautas-actions';
import { FORMATOS_PAUTA, STATUS_PAUTA, OBJETIVOS, APROVACAO_COPY, ordenarPautas, corPilar } from '@/lib/pautas';
import { formatarData, formatarHora } from '@/lib/formatos';
import { Modal, Copiar, Etiquetas, CardPauta, ConteudoPauta, Comentarios, textoCompleto } from './PautaUI';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const chave = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// interno = true → "Quadro interno" (só a equipe vê). false → pautas que o cliente vê.
export default function Pautas({ clienteId, pautas, pilares, interno = false }) {
  const [vista, setVista] = useState('cards');
  const [filtroPilar, setFiltroPilar] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [aberta, setAberta] = useState(null); // { id } | { nova: {...} } ; editando
  const [editando, setEditando] = useState(false);

  const pilaresUsados = useMemo(
    () => [...new Set([...pilares, ...pautas.map((p) => p.pilar).filter(Boolean)])],
    [pilares, pautas]
  );
  const filtradas = ordenarPautas(pautas).filter((p) =>
    (!filtroPilar || p.pilar === filtroPilar) && (!filtroStatus || p.status === filtroStatus)
  );
  const pautaAberta = aberta?.id ? pautas.find((p) => p.id === aberta.id) : aberta?.nova;

  const nova = (data = '') => {
    setAberta({ nova: { titulo: '', data, formato: 'carrossel', status: 'rascunho', pilar: '', objetivo: '', blocos: [''], legenda: '', notas: '' } });
    setEditando(true);
  };
  const abrir = (p) => { setAberta({ id: p.id }); setEditando(false); };
  const fechar = () => { setAberta(null); setEditando(false); };

  return (
    <div>
      {interno && (
        <div className="aviso" style={{ background: '#ece7e0', color: 'var(--texto)' }}>
          🔒 Quadro interno: só a equipe da Philar vê. Use para ideias, brainstorm e pautas em construção.
        </div>
      )}

      <div className="barra-salvar">
        <div className="acoes" style={{ margin: 0, alignItems: 'center' }}>
          <div className="abas">
            <button className={vista === 'cards' ? 'ativa' : ''} onClick={() => setVista('cards')}>Cards</button>
            <button className={vista === 'calendario' ? 'ativa' : ''} onClick={() => setVista('calendario')}>Calendário</button>
          </div>
          <select value={filtroPilar} onChange={(e) => setFiltroPilar(e.target.value)} className="filtro">
            <option value="">Todos os pilares</option>
            {pilaresUsados.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="filtro">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_PAUTA).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <button className="btn" onClick={() => nova()}>+ {interno ? 'Novo card' : 'Nova pauta'}</button>
      </div>

      {vista === 'cards' ? (
        filtradas.length === 0 ? (
          <p className="vazio">
            {pautas.length === 0
              ? interno ? 'Nenhum card interno ainda.' : 'Nenhuma pauta ainda. Clique em “+ Nova pauta”.'
              : 'Nada com esses filtros.'}
          </p>
        ) : (
          <div className="galeria">
            {filtradas.map((p) => (
              <CardPauta key={p.id} pauta={p} aoAbrir={() => abrir(p)} mostrarStatus mostrarAprovacao={!interno && p.status !== 'rascunho'} />
            ))}
          </div>
        )
      ) : (
        <Calendario pautas={filtradas} aoAbrir={abrir} aoCriar={nova} />
      )}

      {pautaAberta && (
        <Modal aoFechar={fechar}>
          {editando ? (
            <EditarPauta
              clienteId={clienteId}
              pauta={pautaAberta}
              pilares={pilaresUsados}
              interno={interno}
              aoCancelar={() => (pautaAberta.id ? setEditando(false) : fechar())}
              aoSalvar={fechar}
            />
          ) : (
            <VerPauta pauta={pautaAberta} interno={interno} aoEditar={() => setEditando(true)} aoFechar={fechar} />
          )}
        </Modal>
      )}
    </div>
  );
}

function Calendario({ pautas, aoAbrir, aoCriar }) {
  const [mes, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const porDia = {};
  pautas.forEach((p) => { if (p.data) (porDia[p.data] ||= []).push(p); });
  const inicio = new Date(mes);
  inicio.setDate(1 - mes.getDay());
  const dias = Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  const visiveis = dias[35].getMonth() !== mes.getMonth() ? dias.slice(0, 35) : dias;
  const hoje = chave(new Date());
  const semData = pautas.filter((p) => !p.data);
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
            <div
              key={k}
              className={`cal-dia pauta-dia${d.getMonth() !== mes.getMonth() ? ' fora' : ''}${k === hoje ? ' hoje' : ''}`}
              onClick={(e) => { if (e.target === e.currentTarget) aoCriar(k); }}
            >
              <div className="cal-num" onClick={() => aoCriar(k)}>{d.getDate()}</div>
              {(porDia[k] || []).map((p) => (
                <button key={p.id} className={`cal-item pill ${p.status}`} title={p.titulo} onClick={() => aoAbrir(p)}>
                  {p.pilar && <i className={`ponto ${corPilar(p.pilar)}`} />}{p.titulo}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      {semData.length > 0 && (
        <p className="sem-data">
          Sem data:{' '}
          {semData.map((p, i) => (
            <span key={p.id}>{i > 0 && ', '}<button className="link-botao" onClick={() => aoAbrir(p)}>{p.titulo}</button></span>
          ))}
        </p>
      )}
    </div>
  );
}

function VerPauta({ pauta, interno, aoEditar, aoFechar }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const rodar = (fn) => iniciar(async () => { await fn(); router.refresh(); });

  return (
    <div>
      <h2 style={{ marginBottom: 10, paddingRight: 36 }}>{pauta.titulo}</h2>
      <Etiquetas pauta={pauta} mostrarStatus={false} />

      <div className="acoes" style={{ alignItems: 'center', marginTop: 14 }}>
        <select
          className={`pill ${pauta.status}`}
          value={pauta.status}
          disabled={pendente}
          onChange={(e) => rodar(() => mudarStatusPauta(pauta.id, e.target.value))}
          style={{ width: 'auto', fontWeight: 600, fontSize: 13, padding: '6px 10px' }}
        >
          {Object.entries(STATUS_PAUTA).map(([s, t]) => <option key={s} value={s}>{t}</option>)}
        </select>
        <Copiar texto={textoCompleto(pauta)} rotulo="Copiar tudo" className="btn mini" />
        <button className="btn claro mini" onClick={aoEditar}>Editar</button>
      </div>

      {!interno && (
        <p className="linha-aprov">
          {pauta.status === 'rascunho'
            ? '👁 Rascunho: o cliente ainda não vê esta pauta. Mude o status para liberar.'
            : <>Cliente: <span className={`tag aprov ${pauta.aprovacao}`}>{APROVACAO_COPY[pauta.aprovacao]}</span></>}
        </p>
      )}

      <ConteudoPauta pauta={pauta} />

      {!interno && (
        <Comentarios
          comentarios={pauta.comentarios || []}
          souCliente={false}
          pendente={pendente}
          aoEnviar={(t) => new Promise((ok) => rodar(async () => { await comentarPautaEquipe(pauta.id, t); ok(); }))}
        />
      )}

      <p className="sub" style={{ fontSize: 12, marginTop: 16 }}>
        {pauta.autor?.nome && `Criada por ${pauta.autor.nome.split(' ')[0]}`}
        {pauta.editor?.nome && ` · última edição por ${pauta.editor.nome.split(' ')[0]} em ${formatarHora(pauta.atualizado_em)}`}
      </p>
      <div className="acoes" style={{ justifyContent: 'space-between', marginBottom: 0 }}>
        <button
          className="btn claro mini" disabled={pendente}
          onClick={() => rodar(async () => { await moverPauta(pauta.id, !interno); aoFechar(); })}
        >
          {interno ? '→ Mover para as pautas do cliente' : '🔒 Mover para o quadro interno'}
        </button>
        <button
          className="btn perigo mini" disabled={pendente}
          onClick={() => window.confirm('Excluir esta pauta?') && rodar(async () => { await excluirPauta(pauta.id); aoFechar(); })}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

function EditarPauta({ clienteId, pauta, pilares, interno, aoCancelar, aoSalvar }) {
  const router = useRouter();
  const [d, setD] = useState(() => ({ ...pauta, pilar: pauta.pilar || '', objetivo: pauta.objetivo || '', blocos: pauta.blocos?.length ? [...pauta.blocos] : [''] }));
  const [pilarLivre, setPilarLivre] = useState(() => !!pauta.pilar && !pilares.includes(pauta.pilar));
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const f = FORMATOS_PAUTA[d.formato] || FORMATOS_PAUTA.carrossel;
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });

  const mudarBloco = (i, v) => { const b = [...d.blocos]; b[i] = v; setD({ ...d, blocos: b }); };
  const removerBloco = (i) => setD({ ...d, blocos: d.blocos.filter((_, j) => j !== i) });
  const moverBloco = (i, dir) => {
    const b = [...d.blocos]; const j = i + dir;
    if (j < 0 || j >= b.length) return;
    [b[i], b[j]] = [b[j], b[i]]; setD({ ...d, blocos: b });
  };

  const salvar = (e) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await salvarPauta(clienteId, { ...d, interno, blocos: d.blocos.filter((b) => b.trim()) });
      if (r?.erro) return setErro(r.erro);
      router.refresh();
      aoSalvar();
    });
  };

  return (
    <form onSubmit={salvar}>
      <h2 style={{ marginBottom: 16, paddingRight: 36 }}>{pauta.id ? 'Editar pauta' : interno ? 'Novo card interno' : 'Nova pauta'}</h2>
      <div className="campo">
        <label>Título / tema</label>
        <input value={d.titulo} onChange={set('titulo')} placeholder="Ex: Estreia — contagem regressiva" autoFocus required />
      </div>
      <div className="linha3">
        <div className="campo">
          <label>Data</label>
          <input type="date" value={d.data || ''} onChange={set('data')} />
        </div>
        <div className="campo">
          <label>Formato</label>
          <select value={d.formato} onChange={set('formato')}>
            {Object.entries(FORMATOS_PAUTA).map(([v, x]) => <option key={v} value={v}>{x.nome}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Status</label>
          <select value={d.status} onChange={set('status')}>
            {Object.entries(STATUS_PAUTA).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="linha2">
        <div className="campo">
          <label>Pilar de conteúdo</label>
          {!pilarLivre ? (
            <select
              value={d.pilar}
              onChange={(e) => (e.target.value === '__outro' ? (setPilarLivre(true), setD({ ...d, pilar: '' })) : setD({ ...d, pilar: e.target.value }))}
            >
              <option value="">—</option>
              {pilares.map((p) => <option key={p}>{p}</option>)}
              <option value="__outro">Outro…</option>
            </select>
          ) : (
            <input value={d.pilar} onChange={set('pilar')} placeholder="Nome do pilar" />
          )}
          {pilares.length === 0 && !pilarLivre && (
            <p className="sub" style={{ fontSize: 12, marginTop: 4 }}>Dica: escreva os pilares na aba Linha editorial (um por linha).</p>
          )}
        </div>
        <div className="campo">
          <label>Objetivo</label>
          <select value={d.objetivo} onChange={set('objetivo')}>
            <option value="">—</option>
            {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <label>{f.bloco === 'Arte' ? 'Texto da arte' : `${f.bloco}s`}</label>
      {d.blocos.map((b, i) => (
        <div key={i} className="bloco-editar">
          <div className="bloco-cab">
            <b>{f.bloco} {i + 1}</b>
            <div className="acoes" style={{ margin: 0, gap: 2 }}>
              <button type="button" className="btn-icone" onClick={() => moverBloco(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
              <button type="button" className="btn-icone" onClick={() => moverBloco(i, 1)} disabled={i === d.blocos.length - 1} aria-label="Descer">↓</button>
              {d.blocos.length > 1 && <button type="button" className="btn-icone" onClick={() => removerBloco(i)} aria-label="Remover">×</button>}
            </div>
          </div>
          <textarea value={b} onChange={(e) => mudarBloco(i, e.target.value)} placeholder={f.dica} rows={2} />
        </div>
      ))}
      <button type="button" className="btn claro mini" style={{ marginBottom: 16 }} onClick={() => setD({ ...d, blocos: [...d.blocos, ''] })}>
        + {f.bloco === 'Arte' ? 'Mais uma arte' : `Adicionar ${f.bloco.toLowerCase()}`}
      </button>

      <div className="campo">
        <label>Legenda</label>
        <textarea value={d.legenda} onChange={set('legenda')} rows={4} />
      </div>
      <div className="campo">
        <label>Notas para o design {!interno && <span style={{ fontWeight: 400 }}>(o cliente não vê)</span>}</label>
        <textarea value={d.notas} onChange={set('notas')} rows={2} placeholder="Referências, fotos a usar, áudio do reels, cores…" />
      </div>

      {erro && <p className="erro">{erro}</p>}
      <div className="acoes" style={{ marginBottom: 0 }}>
        <button className="btn" disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="btn claro" onClick={aoCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
