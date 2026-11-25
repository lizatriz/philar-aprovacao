import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { exigirEquipe } from '@/lib/auth';
import { db, BUCKET, carregarPosts, urlAssinada } from '@/lib/supabase';
import { cofreConfigurado } from '@/lib/cofre';
import { formatarHora } from '@/lib/formatos';
import { excluirCliente, gerarLinkNovo } from '@/app/actions';
import NavAdmin from '@/components/NavAdmin';
import NovoPost from '@/components/NovoPost';
import CopiarLink from '@/components/CopiarLink';
import Portal from '@/components/Portal';
import BotaoConfirmar from '@/components/BotaoConfirmar';
import EnviarLogo from '@/components/EnviarLogo';
import LinhaEditorial from '@/components/LinhaEditorial';
import ArquivosMarca from '@/components/ArquivosMarca';
import Acessos from '@/components/Acessos';
import ConfigurarCofre from '@/components/ConfigurarCofre';

export const dynamic = 'force-dynamic';

const ABAS = [
  ['conteudos', 'Conteúdos'],
  ['linha', 'Linha editorial'],
  ['marca', 'Marca'],
  ['acessos', 'Acessos'],
];

export default async function ClienteAdmin({ params, searchParams }) {
  const membro = await exigirEquipe();
  const souDona = membro.papel === 'dona';
  const { id } = await params;
  const pedida = (await searchParams)?.aba;
  const aba = ABAS.some(([a]) => a === pedida) ? pedida : 'conteudos';

  const { data: cliente } = await db()
    .from('clientes')
    .select('*, editor:equipe!clientes_linha_atualizada_por_fkey(nome)')
    .eq('id', id)
    .maybeSingle();
  if (!cliente) notFound();
  const logoUrl = await urlAssinada(cliente.logo_path);

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
        {souDona && (
          <BotaoConfirmar
            acao={excluirCliente.bind(null, cliente.id)}
            pergunta={`Excluir ${cliente.nome} com todos os posts, arquivos e acessos? Isso não tem volta.`}
            className="btn perigo mini"
          >
            Excluir cliente
          </BotaoConfirmar>
        )}
      </header>

      <nav className="secoes" style={{ marginBottom: 24 }}>
        {ABAS.map(([a, t]) => (
          <Link key={a} href={`/admin/${cliente.id}?aba=${a}`} className={aba === a ? 'ativa' : ''} scroll={false}>
            {t}
          </Link>
        ))}
      </nav>

      {aba === 'conteudos' && <AbaConteudos cliente={cliente} logoUrl={logoUrl} />}
      {aba === 'linha' && (
        <LinhaEditorial
          clienteId={cliente.id}
          inicial={cliente.linha_editorial || {}}
          atualizadoInfo={cliente.linha_atualizada_em
            ? `Atualizada em ${formatarHora(cliente.linha_atualizada_em)}${cliente.editor?.nome ? ` por ${cliente.editor.nome.split(' ')[0]}` : ''}`
            : null}
        />
      )}
      {aba === 'marca' && <AbaMarca clienteId={cliente.id} />}
      {aba === 'acessos' && <AbaAcessos clienteId={cliente.id} souDona={souDona} />}
    </main>
  );
}

async function AbaConteudos({ cliente, logoUrl }) {
  const posts = await carregarPosts(cliente.id, { comNomes: true });
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const link = `${proto}://${host}/c/${cliente.token}`;

  return (
    <>
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
    </>
  );
}

async function AbaMarca({ clienteId }) {
  const supa = db();
  const { data } = await supa
    .from('arquivos_marca')
    .select('*, autor:equipe(nome)')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false });
  const arquivos = await Promise.all((data || []).map(async (a) => {
    const [ver, baixar] = await Promise.all([
      a.tipo?.startsWith('image/') ? supa.storage.from(BUCKET).createSignedUrl(a.path, 3600) : { data: null },
      supa.storage.from(BUCKET).createSignedUrl(a.path, 3600, { download: a.nome }),
    ]);
    return { ...a, url: ver.data?.signedUrl || null, download: baixar.data?.signedUrl || '#' };
  }));
  return <ArquivosMarca clienteId={clienteId} arquivos={arquivos} />;
}

async function AbaAcessos({ clienteId, souDona }) {
  if (!cofreConfigurado()) return <ConfigurarCofre souDona={souDona} />;
  // A senha cifrada NÃO vai para o navegador; só é aberta pelo botão "Mostrar"/"Copiar".
  const { data } = await db()
    .from('acessos')
    .select('id, plataforma, usuario, link, observacoes, atualizado_em')
    .eq('cliente_id', clienteId)
    .order('plataforma');
  let acessos = data || [];
  if (souDona && acessos.length) {
    const { data: logs } = await db()
      .from('acessos_log')
      .select('id, acesso_id, acao, criado_em, membro:equipe(nome)')
      .in('acesso_id', acessos.map((a) => a.id))
      .order('criado_em', { ascending: false })
      .limit(300);
    acessos = acessos.map((a) => ({
      ...a,
      historico: (logs || []).filter((l) => l.acesso_id === a.id).slice(0, 15),
    }));
  }
  return <Acessos clienteId={clienteId} acessos={acessos} souDona={souDona} />;
}
