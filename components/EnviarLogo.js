'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { enviarLogo } from '@/lib/upload-client';
import { removerLogo } from '@/app/actions';

export default function EnviarLogo({ alvo, urlAtual, rotulo }) {
  const input = useRef(null);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();

  async function escolher(e) {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    setErro('');
    setEnviando(true);
    try {
      await enviarLogo(alvo, arq);
      router.refresh();
    } catch (err) {
      setErro(err.message || 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="enviar-logo">
      <div className="logo-prev">
        {urlAtual
          ? <img src={urlAtual} alt={rotulo} /> /* eslint-disable-line @next/next/no-img-element */
          : <span>sem logo</span>}
      </div>
      <div>
        <label style={{ marginBottom: 8 }}>{rotulo}</label>
        <div className="acoes" style={{ marginBottom: 0 }}>
          <button type="button" className="btn mini" disabled={enviando} onClick={() => input.current?.click()}>
            {enviando ? 'Enviando…' : urlAtual ? 'Trocar logo' : 'Enviar logo'}
          </button>
          {urlAtual && (
            <button
              type="button" className="btn perigo mini" disabled={pendente || enviando}
              onClick={() => window.confirm('Remover este logo?') && iniciar(async () => { await removerLogo(alvo); router.refresh(); })}
            >
              Remover
            </button>
          )}
        </div>
        {erro && <p className="erro" style={{ margin: '6px 0 0' }}>{erro}</p>}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={escolher} />
      </div>
    </div>
  );
}
