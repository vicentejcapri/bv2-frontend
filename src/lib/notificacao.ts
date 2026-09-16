import type { Placeholder, StatusNotificavel } from "@/lib/notificacao-api"

/** Como cada gatilho aparece para a M2 no modal de configuração. */
export const GATILHO_NOTIFICACAO: Record<
  StatusNotificavel,
  { titulo: string; quando: string }
> = {
  CONCLUIDA: {
    titulo: "Ordem de serviço concluída",
    quando: "Enviada quando o serviço é concluído.",
  },
  ENTREGUE: {
    titulo: "Ordem de serviço entregue",
    quando: "Enviada quando o equipamento é entregue ao cliente.",
  },
  CANCELADA: {
    titulo: "Ordem de serviço cancelada",
    quando: "Enviada quando a ordem de serviço é cancelada.",
  },
}

/**
 * Troca cada {chave} pelo exemplo do próprio backend (GET
 * /notificacoes/placeholders), do mesmo jeito que o RenderizadorMensagem faz na
 * hora do envio.
 */
export function renderizarPrevia(conteudo: string, placeholders: Placeholder[]) {
  return placeholders.reduce(
    (texto, p) => texto.replaceAll(p.marcador, p.exemplo),
    conteudo
  )
}
