/**
 * Número da ordem como aparece na tela: o id, sem prefixo. Onde ele entra numa
 * frase, quem escreve a frase põe a palavra ("ordem 1042"). "OS" é abreviação
 * nossa; o usuário lê sempre "ordem de serviço".
 */
export function numeroOS(id: number) {
  return String(id)
}
