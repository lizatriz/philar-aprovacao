import Link from 'next/link';
import { exigirEquipe } from '@/lib/auth';
import { db, logoAgencia, urlsAssinadas } from '@/lib/supabase';
import { criarCliente } from '@/app/actions';
import EnviarLogo from '@/components/EnviarLogo';
import NavAdmin from '@/components/NavAdmin';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const membro = await exigirEquipe();
  const { data: clientes, error } = await db()
    .from('clientes')
    .select('id, nome, logo_path, posts(status)')
    .order('nome');
  if (error) throw new Error(error.message);
  const [logoUrl, logos] = await Promise.all([
    logoAgencia(),
    urlsAssinadas((clientes || []).map((c) => c.logo_path)),
  ]);

  return (
    <main className="pagina">
      <NavAdmin membro={membro} ativa="clientes" />
      <header className="topo">
        <h1>Olá, {membro.nome.split(' ')[0]}</h1>
      </header>

      <div className={membro.papel === 'dona' ? 'config-cliente' : ''} style={{ marginBottom: 24 }}>
        {membro.papel === 'dona' && (
          <div className="caixa">
            <EnviarLogo alvo="agencia" urlAtual={logoUrl} rotulo="Logo da Philar" />
          </div>
        )}
        <form action={criarCliente} className="caixa" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input name="nome" placeholder="Nome do novo cliente" required />
          <button className="btn" style={{ whiteSpace: 'nowrap' }}>+ Adicionar</button>
        </form>
      </div>

      {!clientes?.length ? (
        <p className="vazio">Nenhum cliente ainda. Adicione o primeiro acima.</p>
      ) : (
        <div className="lista-clientes">
          {clientes.map((c) => {
            const conta = (s) => c.posts.filter((p) => p.status === s).length;
            const logo = logos[c.logo_path];
            return (
              <Link key={c.id} href={`/admin/${c.id}`} className="caixa cartao-cliente">
                <div className="titulo-cartao">
                  {logo && <img src={logo} alt="" className="logo-cliente mini" /> /* eslint-disable-line @next/next/no-img-element */}
                  <h3>{c.nome}</h3>
                </div>
                <div className="resumo">
                  <span className="selo pendente">{conta('pendente')} aguardando</span>
                  <span className="selo ajuste">{conta('ajuste')} ajuste</span>
                  <span className="selo aprovado">{conta('aprovado')} aprovados</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
