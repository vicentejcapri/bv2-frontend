/**
 * 1042 -> "Nº 1042". "OS" é abreviação nossa; na tela o usuário lê sempre
 * "ordem de serviço", então o prefixo não aparece.
 */
export function numeroOS(id: number) {
  return `Nº ${id}`
}
