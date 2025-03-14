import React, { useState } from 'react';

function BotaoImagem() {
  const [estaPressionado, setEstaPressionado] = useState(false);

  // Caminhos das imagens (substitua com seus próprios caminhos)
  const imagemNormal = '/caminho/para/botao-normal.png';
  const imagemPressionado = '/caminho/para/botao-pressionado.png';

  return (
    <button 
      className="botao-imagem"
      onClick={() => setEstaPressionado(!estaPressionado)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }}
    >
      <img 
        src={estaPressionado ? imagemPressionado : imagemNormal} 
        alt="Botão Interativo"
        style={{
          width: '100px', // Ajuste o tamanho conforme necessário
          transition: 'transform 0.1s',
          transform: estaPressionado ? 'translateY(2px)' : 'translateY(0)'
        }}
      />
    </button>
  );
}

export default BotaoImagem;