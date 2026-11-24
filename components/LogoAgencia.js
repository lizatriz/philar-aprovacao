// Mostra o logo da agência; se ainda não houver, mostra o nome em texto.
export default function LogoAgencia({ url, legenda }) {
  return (
    <div className="faixa-marca">
      {url
        ? <img src={url} alt="Philar" className="logo-agencia" /> /* eslint-disable-line @next/next/no-img-element */
        : <span className="marca" style={{ color: 'var(--texto)' }}>Philar</span>}
      {legenda && <span className="marca">{legenda}</span>}
    </div>
  );
}
