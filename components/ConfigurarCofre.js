'use client';

import { useState } from 'react';

// Gera a chave do cofre AQUI no navegador (ela nunca passa pelo servidor nem fica salva no site).
export default function ConfigurarCofre({ souDona }) {
  const [chave, setChave] = useState('');
  const [copiada, setCopiada] = useState(false);

  function gerar() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    setChave(btoa(String.fromCharCode(...bytes)));
  }

  if (!souDona) {
    return <div className="aviso">O cofre de senhas ainda não foi configurado. Peça para a dona da agência fazer a configuração.</div>;
  }

  return (
    <div className="caixa" style={{ maxWidth: 620 }}>
      <h3 style={{ marginBottom: 8 }}>Configurar o cofre (uma vez só)</h3>
      <p className="sub" style={{ marginTop: 0 }}>
        O cofre precisa de uma chave secreta para embaralhar as senhas. Ela fica guardada só na Vercel.
      </p>
      <ol className="passos">
        <li>Clique em <b>Gerar chave</b> e depois em <b>Copiar</b>.</li>
        <li>Na Vercel, abra o projeto → <b>Settings</b> → <b>Environment Variables</b>.</li>
        <li>Crie a variável <code>COFRE_CHAVE</code> e cole a chave no valor. Salve.</li>
        <li>Vá em <b>Deployments</b>, clique nos <b>⋯</b> do primeiro da lista e depois em <b>Redeploy</b>.</li>
      </ol>
      {!chave ? (
        <button className="btn" onClick={gerar}>Gerar chave</button>
      ) : (
        <div className="link-copiar">
          <input readOnly value={chave} onFocus={(e) => e.target.select()} />
          <button
            className="btn mini"
            onClick={async () => { await navigator.clipboard.writeText(chave); setCopiada(true); }}
          >
            {copiada ? 'Copiada!' : 'Copiar'}
          </button>
        </div>
      )}
      <p className="sub" style={{ fontSize: 12, marginTop: 14 }}>
        ⚠️ Depois de cadastrar senhas, não troque nem apague essa variável na Vercel: sem ela, as senhas não abrem mais.
      </p>
    </div>
  );
}
