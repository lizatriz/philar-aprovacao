'use client';

import { useState } from 'react';

export default function CopiarLink({ link }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="link-copiar">
      <input readOnly value={link} onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn mini"
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        }}
      >
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
      <a className="btn claro mini" href={link} target="_blank" rel="noreferrer">Abrir</a>
    </div>
  );
}
