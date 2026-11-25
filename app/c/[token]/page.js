import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, clientePorToken, carregarPosts, logoAgencia, urlAssinada } from '@/lib/supabase';
import Portal from '@/components/Portal';
import LogoAgencia from '@/components/LogoAgencia';
import PautasCliente from '@/components/PautasCliente';
import LinhaCliente from '@/components/LinhaCliente';

export const dynamic = 'force-dynamic';

// O cliente vê só pautas compartilhadas (fora do quadro interno) que já saíram do rascunho.
// Campos internos (notas para o design, quem criou) não são enviados.
async function pautasDoCliente(clienteId) {
  const { data } = await db()
    .from('pautas')
    .select('id, titulo, data, formato, pilar, objetivo, blocos, legenda, aprovacao, criado_em, comentarios:pauta_comentarios(id, autor, texto, criado_em)')
    .eq('cliente_id', clienteId)
    .eq('interno', false)
    .neq('status', 'rascunho');
  return (data || []).map((p) => ({
    ...p,
    comentarios: [...(p.comentarios || [])].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
  }));
}

export default async function PaginaCliente({ params, searchParams }) {
  const { token } = await params;
  const cliente = await clientePorToken(token);
  if (!cliente) notFound();
  const pedida = (await searchParams)?.aba;
  const aba = ['artes', 'pautas', 'linha'].includes(pedida) ? pedida : null;

  const [posts, pautas, logoPhilar, logoCliente] = await Promise.all([
    carregarPosts(cliente.id),
    pautasDoCliente(cliente.id),
    logoAgencia(),
    urlAssinada(cliente.logo_path),
  ]);
  const artesPendentes = posts.filter((p) => p.status === 'pendente').length;
  const copysPendentes = pautas.filter((p) => p.aprovacao === 'pendente').length;
  // Sem aba escolhida: abre onde tem algo esperando
  const atual = aba || (artesPendentes === 0 && copysPendentes > 0 ? 'pautas' : 'artes');
  const total = artesPendentes + copysPendentes;

  const abas = [
    ['artes', 'Artes', artesPendentes],
    ['pautas', 'Pautas', copysPendentes],
    ['linha', 'Linha editorial', 0],
  ];

  return (
    <main className="pagina">
      <LogoAgencia url={logoPhilar} legenda="Área do cliente" />
      <header className="topo">
        <div className="cab-cliente">
          {logoCliente && <img src={logoCliente} alt={cliente.nome} className="logo-cliente" /> /* eslint-disable-line @next/next/no-img-element */}
          <div>
            <h1>Olá, {cliente.nome}</h1>
            <p className="sub">
              {total === 0
                ? 'Tudo em dia por aqui. Nada aguardando sua aprovação.'
                : `${total} ${total === 1 ? 'item aguarda' : 'itens aguardam'} sua aprovação.`}
            </p>
          </div>
        </div>
      </header>

      <nav className="abas-topo">
        {abas.map(([a, t, n]) => (
          <Link key={a} href={`/c/${token}?aba=${a}`} className={atual === a ? 'ativa' : ''} scroll={false}>
            {t}{n > 0 && <span className="bolinha">{n}</span>}
          </Link>
        ))}
      </nav>

      {atual === 'artes' && <Portal posts={posts} modo="cliente" token={token} />}
      {atual === 'pautas' && <PautasCliente token={token} pautas={pautas} />}
      {atual === 'linha' && <LinhaCliente linha={cliente.linha_editorial} />}
    </main>
  );
}
