const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

/** 1200 -> "R$ 1.200,00" */
export function formatBRL(valor: number) {
  return BRL.format(valor)
}

/**
 * Formata enquanto o usuário digita, tratando a entrada como centavos:
 * "1", "12", "125000" -> "0,01", "0,12", "1.250,00".
 */
export function maskMoeda(bruto: string) {
  const digitos = bruto.replace(/\D/g, "").slice(0, 11)
  if (!digitos) return ""
  const centavos = Number(digitos) / 100
  return centavos.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** "1.250,00" -> 1250 */
export function parseMoeda(mascarado: string) {
  const digitos = mascarado.replace(/\D/g, "")
  return digitos ? Number(digitos) / 100 : 0
}

/** Máscara de telefone brasileiro, fixo ou celular. */
export function maskTelefone(bruto: string) {
  const d = bruto.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1")
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{0,4})/, "($1) $2")
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

/** "2026-05-30" (valor de <input type="date">) -> "30/05/2026" */
export function formatDataBR(iso: string) {
  if (!iso) return ""
  const [ano, mes, dia] = iso.split("-")
  return `${dia}/${mes}/${ano}`
}

/** Data de hoje no formato aceito por <input type="date">. */
export function hojeISO() {
  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")
  return `${hoje.getFullYear()}-${mes}-${dia}`
}
