'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarLinhaEditorial } from '@/app/hub-actions';
import { SECOES_LINHA } from '@/lib/linha';

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
              <textarea
                id={`l-${c}`}
                value={campos[c] || ''}
                placeholder={dica}
                onChange={(e) => mudar(c, e.target.value)}
                rows={c === 'cores' || c === 'hashtags' ? 2 : 4}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
