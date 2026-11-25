'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarLinhaEditorial } from '@/app/hub-actions';
import { SECOES_LINHA } from '@/lib/linha';
import { extrairPilares, corPilar } from '@/lib/pautas';

const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

export default function LinhaEditorial({ clienteId, inicial, atualizadoInfo }) {
  const router = useRouter();
  const [campos, setCampos] = useState(() => ({ ...inicial }));
  const [alterado, setAlterado] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendente, iniciar] = useTransition();

  const mudar = (c, v) => { setCampos((x) => ({ ...x, [c]: v })); setAlterado(true); setMsg(null); };

  function salvar() {
    iniciar(async () => {
      const r = await salvarLinhaEditorial(clienteId, campos);
      if (r?.erro) setMsg({ erro: r.erro });
      else { setMsg({ ok: 'Salvo!' }); setAlterado(false); router.refresh(); }
    });
  }

  return (
    <div>
      <div className="barra-salvar">
        <span className="sub" style={{ margin: 0 }}>{atualizadoInfo || 'Ainda não preenchida.'}</span>
        <div className="acoes" style={{ marginBottom: 0, alignItems: 'center' }}>
          {msg?.ok && <span className="sucesso">{msg.ok}</span>}
          {msg?.erro && <span className="erro">{msg.erro}</span>}
          <button className="btn" disabled={!alterado || pendente} onClick={salvar}>
            {pendente ? 'Salvando…' : alterado ? 'Salvar alterações' : 'Tudo salvo'}
          </button>
        </div>
      </div>

      <div className="grade-linha">
        {SECOES_LINHA.map(([c, titulo, dica]) => {
          const cores = c === 'cores' ? (campos[c] || '').match(HEX) || [] : [];
          return (
            <div key={c} className={`caixa secao-linha${['posicionamento', 'observacoes'].includes(c) ? ' larga' : ''}`}>
              <label htmlFor={`l-${c}`}>{titulo}</label>
              {cores.length > 0 && (
                <div className="amostras">
                  {cores.map((cor, i) => (
                    <span key={i} title={cor}><i style={{ background: cor }} />{cor.toUpperCase()}</span>
                  ))}
                </div>
              )}
              {c === 'pilares' ? (
                <EditorPilares
                  pilares={extrairPilares(campos.pilares)}
                  aoMudar={(lista) => mudar('pilares', lista.join('\n'))}
                />
              ) : (
                <textarea
                  id={`l-${c}`}
                  value={campos[c] || ''}
                  placeholder={dica}
                  onChange={(e) => mudar(c, e.target.value)}
                  rows={c === 'cores' || c === 'hashtags' ? 2 : 4}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pilares como etiquetas: digita, aperta Enter (ou vírgula) e vira uma etiqueta
function EditorPilares({ pilares, aoMudar }) {
  const [texto, setTexto] = useState('');

  function adicionar(valor = texto) {
    const novos = extrairPilares(valor).filter(
      (p) => !pilares.some((x) => x.toLowerCase() === p.toLowerCase())
    );
    if (novos.length) aoMudar([...pilares, ...novos]);
    setTexto('');
  }

  return (
    <div className="editor-pilares">
      <div className="tags" style={{ marginBottom: pilares.length ? 10 : 0 }}>
        {pilares.map((p) => (
          <span key={p} className={`tag pilar grande ${corPilar(p)}`}>
            {p}
            <button
              type="button" className="tag-x" aria-label={`Remover ${p}`}
              onClick={() => aoMudar(pilares.filter((x) => x !== p))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="link-copiar">
        <input
          id="l-pilares"
          value={texto}
          placeholder={pilares.length ? 'Adicionar outro pilar…' : 'Ex: Bastidores (aperte Enter para adicionar)'}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;]/.test(v)) adicionar(v); else setTexto(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); adicionar(); }
            if (e.key === 'Backspace' && !texto && pilares.length) aoMudar(pilares.slice(0, -1));
          }}
          onPaste={(e) => {
            const colado = e.clipboardData.getData('text');
            if (/[\n,;]/.test(colado)) { e.preventDefault(); adicionar(colado); }
          }}
        />
        <button type="button" className="btn mini" disabled={!texto.trim()} onClick={() => adicionar()}>Adicionar</button>
      </div>
    </div>
  );
}
