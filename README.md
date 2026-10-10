# Multiband

Primeira versão funcional de um teclado de acordes com acompanhamento automático.

## Rodar localmente

```powershell
npm install
npm run dev
```

No Windows, também é possível abrir o arquivo `OpenMultiband.bat` com duplo clique. Ele inicia o servidor local e abre o app no navegador.

O áudio usa a Web Audio API e só é liberado depois de uma ação do usuário. A barra de espaço inicia ou para a banda; as teclas `A S D F G H J` selecionam os sete acordes do tom atual.

## Estrutura musical

- `src/music/rhythms.ts`: catálogo de Forró, Baião, Seresta, Reggae e Sertanejo. Cada ritmo define passos de bateria, baixo e acordes.
- `src/music/timbres.ts`: presets de síntese. Eles combinam forma de onda, filtro, ataque, release e brilho.
- `src/audio/AudioEngine.ts`: relógio de áudio, scheduler e instrumentos sintetizados.
- `src/music/keys.ts`: construção dos acordes diatônicos para cada tom.

O controle `Duração do acorde` altera a sustentação das notas dos acordes. Em `Automática do ritmo`, cada padrão decide sua duração; as outras opções forçam 1 tempo, meio compasso ou um compasso.

## Como adicionar um ritmo

Adicione um objeto em `RHYTHMS`. Em um compasso 4/4 existem 16 passos; em 3/4, 12. O passo 0 é o primeiro tempo, 4 o segundo, 8 o terceiro e 12 o quarto em 4/4.

```ts
{
  id: "reggae",
  name: "Reggae",
  description: "Contratempo simples",
  steps: 16,
  drum: { kick: [0, 8], snare: [8], hat: [2, 6, 10, 14] },
  bass: [{ step: 0, note: "root", duration: 3 }],
  chord: [{ step: 4, duration: 2 }, { step: 12, duration: 2 }],
}
```

## Como adicionar um timbre

Adicione um preset em `TIMBRES` e inclua o nome no seletor da interface. Os timbres atuais são sintetizados; samples reais/SoundFonts podem ser adicionados depois sem mudar o formato dos ritmos.
