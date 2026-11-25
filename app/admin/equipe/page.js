import { exigirDona } from '@/lib/auth';
import { db } from '@/lib/supabase';
import NavAdmin from '@/components/NavAdmin';
import { FormNovoMembro, LinhaMembro } from '@/components/Equipe';

export const dynamic = 'force-dynamic';

export default async function Equipe() {
  const dona = await exigirDona();
  const supa = db();
  const [{ data: membros }, { data: usuarios }] = await Promise.all([
    supa.from('equipe').select('*').order('criado_em'),
    supa.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const emails = Object.fromEntries((usuarios?.users || []).map((u) => [u.id, u.email]));

  return (
    <main className="pagina">
      <NavAdmin membro={dona} ativa="equipe" />
      <header className="topo">
        <div>
          <h1>Equipe</h1>
          <p className="sub">Todas as pessoas daqui veem todos os clientes. Só quem é “dona” gerencia a equipe e exclui clientes.</p>
        </div>
      </header>

      <div className="layout-admin">
        <aside>
          <FormNovoMembro />
        </aside>
        <section className="caixa" style={{ padding: 0 }}>
          {(membros || []).map((m) => (
            <LinhaMembro
              key={m.user_id}
              membro={{ ...m, email: emails[m.user_id] || '' }}
              souEu={m.user_id === dona.user_id}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
