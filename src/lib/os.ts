import { parseMoeda } from "@/lib/format"
import type { ItemOS } from "@/data/mocks"

/**
 * "OS-1042" -> "Nº 1042". "OS" é abreviação nossa; na tela o usuário lê
 * sempre "ordem de serviço", então o prefixo não aparece.
 */
export function numeroOS(id: string) {
  return `Nº ${id.replace(/^OS-/, "")}`
}

/**
 * Soma os itens da OS. Os valores ficam formatados nos dados, então a conta
 * passa pelo parse antes de somar.
 */
export function totalItens(itens: ItemOS[]) {
  return itens.reduce((soma, item) => soma + parseMoeda(item.valor), 0)
}

/**
 * Texto curto para a coluna Equipamento: o primeiro equipamento e, havendo
 * outros distintos, quantos faltam ("Torno Mecânico +1").
 */
export function resumoEquipamentos(itens: ItemOS[]) {
  const distintos = [...new Set(itens.map((item) => item.equipamento).filter(Boolean))]
  if (distintos.length === 0) return "—"
  const [primeiro, ...resto] = distintos
  return resto.length > 0 ? `${primeiro} +${resto.length}` : primeiro
}
