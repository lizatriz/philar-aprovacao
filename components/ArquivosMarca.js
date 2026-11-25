'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { enviarArquivosMarca } from '@/lib/upload-client';
import { excluirArquivoMarca } from '@/app/hub-actions';

const tamanho = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const extensao = (nome) => (nome.split('.').pop() || '').slice(0, 4).toUpperCase();

export default function ArquivosMarca({ clienteId, arquivos }) {
  const router = useRouter();
  const input = useRef(null);
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();

  async function escolher(e) {
    const lista = Array.from(e.target.files || []);
    e.target.value = '';
    if (!lista.length) return;
    setErro('');
    try {
      await enviarArquivosMarca(clienteId, lista, (n, t) => setStatus(`Enviando ${n} de ${t}…`));
      router.refresh();
    } catch (err) {
      setErro(err.message || 'Falha no envio.');
    } finally {
      setStatus('');
    }
  }

  return (
    <div>
      <div className="barra-salvar">
        <span className="sub" style={{ margin: 0 }}>Logos, fontes, manual da marca, fotos oficiais, briefings…</span>
        <button className="btn" disabled={!!status} onClick={() => input.current?.click()}>
          {status || '+ Enviar arquivos'}
        </button>
        <input ref={input} type="file" multiple hidden onChange={escolher} />
      </div>
      {erro && <p className="erro">{erro}</p>}

      {arquivos.length === 0 ? (
        <p className="vazio">Nenhum arquivo ainda.</p>
      ) : (
        <div className="grade-arquivos">
          {arquivos.map((a) => (
            <div key={a.id} className="arquivo caixa">
              <div className="arquivo-prev">
                {a.tipo?.startsWith('image/') && a.url
                  ? <img src={a.url} alt="" /> /* eslint-disable-line @next/next/no-img-element */
                  : <span>{extensao(a.nome)}</span>}
              </div>
              <div className="arquivo-nome" title={a.nome}>{a.nome}</div>
              <div className="sub" style={{ margin: 0, fontSize: 12 }}>
                {tamanho(a.tamanho || 0)}{a.autor?.nome ? ` · ${a.autor.nome.split(' ')[0]}` : ''}
              </div>
              <div className="acoes" style={{ margin: '10px 0 0' }}>
                <a className="btn mini" href={a.download} target="_blank" rel="noreferrer">Baixar</a>
                <button
                  className="btn perigo mini" disabled={pendente}
                  onClick={() => window.confirm(`Excluir "${a.nome}"?`) && iniciar(async () => { await excluirArquivoMarca(a.id); router.refresh(); })}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
