'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarPost } from '@/app/actions';
import { enviarArquivos } from '@/lib/upload-client';
import { FORMATOS } from '@/lib/formatos';

export default function NovoPost({ clienteId }) {
  const form = useRef(null);
  const router = useRouter();
  const [arquivos, setArquivos] = useState([]);
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');
  const enviando = status !== '';

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    const fd = new FormData(form.current);
    if (!arquivos.length) return setErro('Escolha pelo menos uma imagem ou vídeo.');
    try {
      const midias = await enviarArquivos(clienteId, arquivos, (n, total) =>
        setStatus(`Enviando arquivo ${n} de ${total}…`)
      );
      setStatus('Salvando…');
      await criarPost(clienteId, {
        titulo: fd.get('titulo'),
        formato: fd.get('formato'),
        legenda: fd.get('legenda'),
        data_publicacao: fd.get('data_publicacao'),
        midias,
      });
      form.current.reset();
      setArquivos([]);
      router.refresh();
    } catch (err) {
      setErro(err.message || 'Algo deu errado. Tente de novo.');
    } finally {
      setStatus('');
    }
  }

  return (
    <form ref={form} onSubmit={enviar} className="caixa">
      <h3 style={{ marginBottom: 16 }}>Novo conteúdo</h3>
      <div className="campo">
        <label htmlFor="titulo">Título interno</label>
        <input id="titulo" name="titulo" placeholder="Ex: Lançamento — carrossel 1" required />
      </div>
      <div className="linha2">
        <div className="campo">
          <label htmlFor="formato">Formato</label>
          <select id="formato" name="formato" defaultValue="feed">
            {Object.entries(FORMATOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="data_publicacao">Data prevista</label>
          <input id="data_publicacao" name="data_publicacao" type="date" />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="legenda">Legenda</label>
        <textarea id="legenda" name="legenda" rows={5} />
      </div>
      <div className="campo">
        <label htmlFor="arquivos">Imagens ou vídeos (na ordem do carrossel)</label>
        <input
          id="arquivos" type="file" multiple accept="image/*,video/*"
          onChange={(e) => setArquivos(Array.from(e.target.files || []))}
        />
        {arquivos.length > 0 && (
          <div className="arquivos-prev">
            {arquivos.map((f, i) => <span key={i}>{i + 1}. {f.name}</span>)}
          </div>
        )}
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button className="btn" disabled={enviando} style={{ width: '100%', justifyContent: 'center' }}>
        {status || 'Enviar para aprovação'}
      </button>
    </form>
  );
}
