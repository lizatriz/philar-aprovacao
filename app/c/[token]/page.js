import { notFound } from 'next/navigation';
import { clientePorToken, carregarPosts } from '@/lib/supabase';
import Portal from '@/components/Portal';

export const dynamic = 'force-dynamic';

export default async function PaginaCliente({ params }) {
  const { token } = await params;
  const cliente = await clientePorToken(token);
  if (!cliente) notFound();
  const posts = await carregarPosts(cliente.id);
  const pendentes = posts.filter((p) => p.status === 'pendente').length;

  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <div className="marca">Philar · Aprovação de conteúdo</div>
          <h1>Olá, {cliente.nome}</h1>
          <p className="sub">
            {pendentes === 0
              ? 'Tudo em dia por aqui. Nenhum conteúdo aguardando sua aprovação.'
              : `${pendentes} ${pendentes === 1 ? 'conteúdo aguarda' : 'conteúdos aguardam'} sua aprovação.`}
          </p>
        </div>
      </header>
      <Portal posts={posts} modo="cliente" token={token} />
    </main>
  );
}
