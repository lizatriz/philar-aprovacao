import Link from 'next/link';
import { logoAgencia } from '@/lib/supabase';
import { sair } from '@/app/equipe-actions';

// Barra do topo da área da agência
export default async function NavAdmin({ membro, ativa }) {
  const logo = await logoAgencia().catch(() => null);
  const links = [
    ['clientes', '/admin', 'Clientes'],
    ...(membro.papel === 'dona' ? [['equipe', '/admin/equipe', 'Equipe']] : []),
    ['conta', '/admin/conta', 'Minha conta'],
  ];
  return (
    <nav className="nav-admin">
      <Link href="/admin" className="nav-logo">
        {logo
          ? <img src={logo} alt="Philar" className="logo-agencia" /> /* eslint-disable-line @next/next/no-img-element */
          : <span className="marca" style={{ color: 'var(--texto)' }}>Philar</span>}
      </Link>
      <div className="nav-links">
        {links.map(([id, href, texto]) => (
          <Link key={id} href={href} className={ativa === id ? 'ativa' : ''}>{texto}</Link>
        ))}
        <span className="nav-quem">{membro.nome.split(' ')[0]}</span>
        <form action={sair}><button className="btn claro mini">Sair</button></form>
      </div>
    </nav>
  );
}
