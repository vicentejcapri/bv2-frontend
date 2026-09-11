import type { StatusNotificavel } from "@/data/mocks"

/**
 * Valores fictícios para a prévia da mensagem — os mesmos exemplos do enum
 * Placeholder do RenderizadorMensagem no backend. Quando a API estiver ligada,
 * esta lista vem de GET /notificacoes/placeholders.
 */
const EXEMPLOS_PLACEHOLDER: Record<string, string> = {
  cliente: "Oficina do Zé",
  os: "34",
  valor: "1.234,56",
  status: "Concluída",
  dataEntrada: "20/08/2026",
  dataConcluida: "03/09/2026",
  dataEntregue: "05/09/2026",
}

/** Troca cada {chave} conhecida pelo exemplo, literal como no backend. */
export function renderizarPrevia(conteudo: string) {
  return Object.entries(EXEMPLOS_PLACEHOLDER).reduce(
    (texto, [chave, exemplo]) => texto.replaceAll(`{${chave}}`, exemplo),
    conteudo
  )
}

/** Como cada gatilho aparece para a M2 no modal de configuração. */
export const GATILHO_NOTIFICACAO: Record<
  StatusNotificavel,
  { titulo: string; quando: string }
> = {
  CONCLUIDO: {
    titulo: "Ordem de serviço concluída",
    quando: "Enviada quando o serviço é concluído.",
  },
  ENTREGUE: {
    titulo: "Ordem de serviço entregue",
    quando: "Enviada quando o equipamento é entregue ao cliente.",
  },
}
