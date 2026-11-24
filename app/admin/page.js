import Link from 'next/link';
import { exigirAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { criarCliente, sair } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  await exigirAdmin();
  const { data: clientes } = await db()
    .from('clientes')
    .select('id, nome, posts(status)')
    .order('nome');

  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <div className="marca">Philar · Área da agência</div>
          <h1>Clientes</h1>
        </div>
        <form action={sair}><button className="btn claro mini">Sair</button></form>
      </header>

      <form action={criarCliente} className="caixa" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input name="nome" placeholder="Nome do novo cliente" required />
        <button className="btn" style={{ whiteSpace: 'nowrap' }}>+ Adicionar</button>
      </form>

      {!clientes?.length ? (
        <p className="vazio">Nenhum cliente ainda. Adicione o primeiro acima.</p>
      ) : (
        <div className="lista-clientes">
          {clientes.map((c) => {
            const conta = (s) => c.posts.filter((p) => p.status === s).length;
            return (
              <Link key={c.id} href={`/admin/${c.id}`} className="caixa cartao-cliente">
                <h3 style={{ marginBottom: 10 }}>{c.nome}</h3>
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
