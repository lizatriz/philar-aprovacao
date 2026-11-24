import { notFound } from 'next/navigation';
import { clientePorToken, carregarPosts, logoAgencia, urlAssinada } from '@/lib/supabase';
import Portal from '@/components/Portal';
import LogoAgencia from '@/components/LogoAgencia';

export const dynamic = 'force-dynamic';

export default async function PaginaCliente({ params }) {
  const { token } = await params;
  const cliente = await clientePorToken(token);
  if (!cliente) notFound();
  const [posts, logoPhilar, logoCliente] = await Promise.all([
    carregarPosts(cliente.id),
    logoAgencia(),
    urlAssinada(cliente.logo_path),
  ]);
  const pendentes = posts.filter((p) => p.status === 'pendente').length;

  return (
    <main className="pagina">
      <LogoAgencia url={logoPhilar} legenda="Aprovação de conteúdo" />
      <header className="topo">
        <div className="cab-cliente">
          {logoCliente && <img src={logoCliente} alt={cliente.nome} className="logo-cliente" /> /* eslint-disable-line @next/next/no-img-element */}
          <div>
            <h1>Olá, {cliente.nome}</h1>
            <p className="sub">
              {pendentes === 0
                ? 'Tudo em dia por aqui. Nenhum conteúdo aguardando sua aprovação.'
                : `${pendentes} ${pendentes === 1 ? 'conteúdo aguarda' : 'conteúdos aguardam'} sua aprovação.`}
            </p>
          </div>
        </div>
      </header>
      <Portal posts={posts} modo="cliente" token={token} />
    </main>
  );
}
