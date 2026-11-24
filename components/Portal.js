'use client';

import { useEffect, useState } from 'react';
import PostCard from './PostCard';
import Calendario from './Calendario';

const FILTROS = [
  ['todos', 'Todos'],
  ['pendente', 'Aguardando'],
  ['ajuste', 'Em ajuste'],
  ['aprovado', 'Aprovados'],
];

export default function Portal({ posts, modo, token }) {
  const [vista, setVista] = useState('lista');
  const [filtro, setFiltro] = useState(modo === 'cliente' && posts.some((p) => p.status === 'pendente') ? 'pendente' : 'todos');
  const [realce, setRealce] = useState(null);

  useEffect(() => {
    if (!realce || vista !== 'lista') return;
    document.getElementById(`post-${realce}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = setTimeout(() => setRealce(null), 2500);
    return () => clearTimeout(t);
  }, [realce, vista]);

  const conta = (s) => (s === 'todos' ? posts.length : posts.filter((p) => p.status === s).length);
  const visiveis = filtro === 'todos' ? posts : posts.filter((p) => p.status === filtro);

  return (
    <>
      <div className="barra">
        <div className="abas">
          <button className={vista === 'lista' ? 'ativa' : ''} onClick={() => setVista('lista')}>Lista</button>
          <button className={vista === 'calendario' ? 'ativa' : ''} onClick={() => setVista('calendario')}>Calendário</button>
        </div>
        {vista === 'lista' && (
          <div className="abas">
            {FILTROS.map(([v, t]) => (
              <button key={v} className={filtro === v ? 'ativa' : ''} onClick={() => setFiltro(v)}>
                {t} ({conta(v)})
              </button>
            ))}
          </div>
        )}
      </div>

      {vista === 'calendario' ? (
        <Calendario
          posts={posts}
          aoEscolher={(id) => { setFiltro('todos'); setVista('lista'); setRealce(id); }}
        />
      ) : visiveis.length === 0 ? (
        <p className="vazio">
          {posts.length === 0
            ? modo === 'cliente' ? 'Ainda não há conteúdos aqui.' : 'Nenhum conteúdo enviado ainda. Use o formulário ao lado.'
            : 'Nada nesta categoria.'}
        </p>
      ) : (
        <div className="grade">
          {visiveis.map((p) => (
            <PostCard key={p.id} post={p} modo={modo} token={token} realce={realce === p.id} />
          ))}
        </div>
      )}
    </>
  );
}
