import { exigirEquipe } from '@/lib/auth';
import NavAdmin from '@/components/NavAdmin';
import { FormNome, FormSenha } from '@/components/FormsConta';

export const dynamic = 'force-dynamic';

export default async function MinhaConta() {
  const membro = await exigirEquipe({ permitirTrocaDeSenha: true });
  return (
    <main className="pagina">
      <NavAdmin membro={membro} ativa="conta" />
      <header className="topo">
        <div>
          <h1>Minha conta</h1>
          <p className="sub">{membro.email}</p>
        </div>
      </header>

      {membro.trocar_senha && (
        <div className="aviso">
          Bem-vinda à Philar! Antes de continuar, crie uma senha só sua no lugar da senha provisória.
        </div>
      )}

      <div className="grade-forms">
        <FormSenha obrigatoria={membro.trocar_senha} />
        {!membro.trocar_senha && <FormNome nomeAtual={membro.nome} />}
      </div>
    </main>
  );
}
