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

const eStory = (p) => p.formato === 'stories';

export default function Portal({ posts, modo, token }) {
  const stories = posts.filter(eStory);
  const feed = posts.filter((p) => !eStory(p));
  const temPendente = (lista) => lista.some((p) => p.status === 'pendente');

  // Abre na aba que tem algo esperando aprovação
  const [secao, setSecao] = useState(() =>
    modo === 'cliente' && !temPendente(feed) && temPendente(stories) ? 'stories' : 'posts'
  );
  const [vista, setVista] = useState('lista');
  const [filtro, setFiltro] = useState(modo === 'cliente' && temPendente(posts) ? 'pendente' : 'todos');
  const [realce, setRealce] = useState(null);

  useEffect(() => {
    if (!realce || vista !== 'lista') return;
    document.getElementById(`post-${realce}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = setTimeout(() => setRealce(null), 2500);
    return () => clearTimeout(t);
  }, [realce, vista, secao]);

  const daSecao = secao === 'stories' ? stories : feed;
  const conta = (s) => (s === 'todos' ? daSecao.length : daSecao.filter((p) => p.status === s).length);
  const visiveis = filtro === 'todos' ? daSecao : daSecao.filter((p) => p.status === filtro);
  const aguardando = (lista) => lista.filter((p) => p.status === 'pendente').length;

  function trocarSecao(nova) {
    setSecao(nova);
    const lista = nova === 'stories' ? stories : feed;
    if (filtro !== 'todos' && !lista.some((p) => p.status === filtro)) setFiltro('todos');
  }

  return (
    <>
      <nav className="secoes">
        {[['posts', 'Posts', feed], ['stories', 'Stories', stories]].map(([v, t, lista]) => (
          <button key={v} className={secao === v && vista === 'lista' ? 'ativa' : ''} onClick={() => { trocarSecao(v); setVista('lista'); }}>
            {t}
            {aguardando(lista) > 0 && <span className="bolinha">{aguardando(lista)}</span>}
          </button>
        ))}
        <button className={vista === 'calendario' ? 'ativa' : ''} onClick={() => setVista('calendario')}>
          Calendário
        </button>
      </nav>

      {vista === 'lista' && (
        <div className="barra">
          <div className="abas">
            {FILTROS.map(([v, t]) => (
              <button key={v} className={filtro === v ? 'ativa' : ''} onClick={() => setFiltro(v)}>
                {t} ({conta(v)})
              </button>
            ))}
          </div>
        </div>
      )}

      {vista === 'calendario' ? (
        <Calendario
          posts={posts}
          aoEscolher={(id) => {
            const p = posts.find((x) => x.id === id);
            setSecao(p && eStory(p) ? 'stories' : 'posts');
            setFiltro('todos'); setVista('lista'); setRealce(id);
          }}
        />
      ) : visiveis.length === 0 ? (
        <p className="vazio">
          {daSecao.length === 0
            ? secao === 'stories'
              ? modo === 'cliente' ? 'Nenhum story para aprovar por enquanto.' : 'Nenhum story enviado. No formulário, escolha o formato “Stories”.'
              : modo === 'cliente' ? 'Ainda não há posts aqui.' : 'Nenhum post enviado ainda. Use o formulário ao lado.'
            : 'Nada nesta categoria.'}
        </p>
      ) : (
        <div className={`grade${secao === 'stories' ? ' grade-stories' : ''}`}>
          {visiveis.map((p) => (
            <PostCard key={p.id} post={p} modo={modo} token={token} realce={realce === p.id} />
          ))}
        </div>
      )}
    </>
  );
}
