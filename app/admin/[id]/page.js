import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { exigirEquipe } from '@/lib/auth';
import NavAdmin from '@/components/NavAdmin';
import { db, carregarPosts, urlAssinada } from '@/lib/supabase';
import { excluirCliente, gerarLinkNovo } from '@/app/actions';
import NovoPost from '@/components/NovoPost';
import CopiarLink from '@/components/CopiarLink';
import Portal from '@/components/Portal';
import BotaoConfirmar from '@/components/BotaoConfirmar';
import EnviarLogo from '@/components/EnviarLogo';

export const dynamic = 'force-dynamic';

export default async function ClienteAdmin({ params }) {
  const membro = await exigirEquipe();
  const { id } = await params;
  const { data: cliente } = await db().from('clientes').select('*').eq('id', id).maybeSingle();
  if (!cliente) notFound();

  const [posts, logoUrl] = await Promise.all([carregarPosts(cliente.id, { comNomes: true }), urlAssinada(cliente.logo_path)]);
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const link = `${proto}://${host}/c/${cliente.token}`;

  return (
    <main className="pagina">
      <NavAdmin membro={membro} ativa="clientes" />
      <header className="topo">
        <div>
          <div className="marca" style={{ marginBottom: 10 }}><Link href="/admin">← Clientes</Link></div>
          <div className="cab-cliente">
            {logoUrl && <img src={logoUrl} alt="" className="logo-cliente" /> /* eslint-disable-line @next/next/no-img-element */}
            <h1>{cliente.nome}</h1>
          </div>
        </div>
        {membro.papel === 'dona' && (
          <BotaoConfirmar
            acao={excluirCliente.bind(null, cliente.id)}
            pergunta={`Excluir ${cliente.nome} e todos os posts? Isso não tem volta.`}
            className="btn perigo mini"
          >
            Excluir cliente
          </BotaoConfirmar>
        )}
      </header>

      <div className="config-cliente">
      <div className="caixa">
        <EnviarLogo alvo={cliente.id} urlAtual={logoUrl} rotulo="Logo do cliente" />
      </div>
      <div className="caixa">
        <label>Link de aprovação do cliente</label>
        <CopiarLink link={link} />
        <form action={gerarLinkNovo.bind(null, cliente.id)} style={{ marginTop: 8 }}>
          <button className="btn perigo mini" style={{ paddingLeft: 0 }}>
            Gerar link novo (o antigo para de funcionar)
          </button>
        </form>
      </div>
      </div>

      <div className="layout-admin">
        <aside>
          <NovoPost clienteId={cliente.id} />
        </aside>
        <section>
          <Portal posts={posts} modo="admin" />
        </section>
      </div>
    </main>
  );
}
