import { SECOES_LINHA } from '@/lib/linha';
import { extrairPilares, corPilar } from '@/lib/pautas';

const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

// Linha editorial em cards, só leitura (portal do cliente)
export default function LinhaCliente({ linha }) {
  const secoes = SECOES_LINHA.filter(([c]) => (linha?.[c] || '').trim());
  if (!secoes.length) return <p className="vazio">A linha editorial ainda está sendo montada pela equipe.</p>;

  return (
    <div className="galeria-linha">
      {secoes.map(([c, titulo]) => {
        const texto = linha[c];
        return (
          <div key={c} className={`caixa card-linha${['posicionamento', 'tom'].includes(c) ? ' larga' : ''}`}>
            <label>{titulo}</label>
            {c === 'pilares' ? (
              <div className="tags" style={{ marginTop: 4 }}>
                {extrairPilares(texto).map((p) => <span key={p} className={`tag pilar grande ${corPilar(p)}`}>{p}</span>)}
              </div>
            ) : c === 'cores' ? (
              <div className="amostras grandes">
                {(texto.match(HEX) || []).map((cor, i) => (
                  <span key={i}><i style={{ background: cor }} />{cor.toUpperCase()}</span>
                ))}
              </div>
            ) : (
              <p className="texto-linha">{texto}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
