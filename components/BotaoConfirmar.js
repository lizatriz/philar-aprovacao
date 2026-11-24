'use client';

import { useTransition } from 'react';

export default function BotaoConfirmar({ acao, pergunta, className, children }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pendente}
      onClick={() => {
        if (window.confirm(pergunta)) iniciar(() => acao());
      }}
    >
      {pendente ? '…' : children}
    </button>
  );
}
