// ==========================================
// DADOS MOCKADOS
// ==========================================

/** Uma linha da OS: um serviço executado sobre um equipamento. */
export type ItemOS = {
  equipamento: string
  servico: string
  valor: string
}

export type OrdemServico = {
  id: string
  cliente: string
  /** Uma OS pode ter vários serviços, inclusive para equipamentos diferentes. */
  itens: ItemOS[]
  status: "EM_ANDAMENTO" | "CONCLUIDO" | "ENTREGUE"
  /** Data em que o equipamento entrou na oficina. */
  entrada: string
  /** Soma dos itens, já formatada. */
  valor: string
  /** Sinaliza atendimento em atraso para destacar no painel. */
  atrasada?: boolean
}

export type Cliente = {
  id: string
  nome: string
  telefone: string
  tipo: "PF" | "PJ"
  cidade: string
  /** Quantidade de OS já abertas para o cliente. */
  ordens: number
}

export type Equipamento = {
  id: string
  tipo: string
  marca: string
  modelo: string
  cliente: string
  serie: string
}

export type Servico = {
  id: string
  nome: string
  descricao: string
  valorBase: string
}

export type Notificacao = {
  id: string
  os: string
  cliente: string
  tipo: "PRAZO_INICIADO" | "PRAZO_ENCERRADO" | "PERSONALIZADO"
  status: "ENVIADO" | "FALHOU" | "PENDENTE"
  data: string
}

export const mockOS: OrdemServico[] = [
  {
    id: "OS-1042",
    cliente: "João Silva",
    itens: [{ equipamento: "Torno Mecânico CNC", servico: "Usinagem de Eixo", valor: "R$ 850,00" }],
    status: "EM_ANDAMENTO",
    entrada: "30/05/2026",
    valor: "R$ 850,00",
  },
  {
    id: "OS-1041",
    cliente: "Oficina do Beto",
    itens: [{ equipamento: "Furadeira de Bancada", servico: "Revisão Geral", valor: "R$ 120,00" }],
    status: "CONCLUIDO",
    entrada: "28/05/2026",
    valor: "R$ 120,00",
  },
  {
    id: "OS-1040",
    cliente: "Maria Souza",
    itens: [{ equipamento: "Serra Circular", servico: "Troca de Rolamento", valor: "R$ 300,00" }],
    status: "ENTREGUE",
    entrada: "25/05/2026",
    valor: "R$ 300,00",
  },
  {
    id: "OS-1039",
    cliente: "Indústria Apex",
    itens: [
      { equipamento: "Motor Elétrico Trifásico", servico: "Rebobinamento Trifásico", valor: "R$ 450,00" },
      { equipamento: "Compressor Schulz CSL 20BR", servico: "Revisão Geral", valor: "R$ 750,00" },
    ],
    status: "EM_ANDAMENTO",
    entrada: "02/06/2026",
    valor: "R$ 1.200,00",
  },
  {
    id: "OS-1038",
    cliente: "Metalúrgica Rio Verde",
    itens: [
      { equipamento: "Compressor de Ar 20pcm", servico: "Diagnóstico Técnico", valor: "R$ 60,00" },
      { equipamento: "Compressor de Ar 20pcm", servico: "Troca de Rolamento", valor: "R$ 580,00" },
    ],
    status: "EM_ANDAMENTO",
    entrada: "22/05/2026",
    valor: "R$ 640,00",
    atrasada: true,
  },
  {
    id: "OS-1037",
    cliente: "Carlos Andrade",
    itens: [{ equipamento: "Esmerilhadeira Angular", servico: "Revisão Geral", valor: "R$ 95,00" }],
    status: "CONCLUIDO",
    entrada: "20/05/2026",
    valor: "R$ 95,00",
  },
]

export const mockClientes: Cliente[] = [
  { id: "1", nome: "João Silva", telefone: "(42) 99999-1111", tipo: "PF", cidade: "Ponta Grossa/PR", ordens: 7 },
  { id: "2", nome: "Oficina do Beto", telefone: "(42) 98888-2222", tipo: "PJ", cidade: "Castro/PR", ordens: 14 },
  { id: "3", nome: "Indústria Apex", telefone: "(42) 3222-3333", tipo: "PJ", cidade: "Ponta Grossa/PR", ordens: 23 },
  { id: "4", nome: "Maria Souza", telefone: "(42) 99777-4444", tipo: "PF", cidade: "Carambeí/PR", ordens: 3 },
  { id: "5", nome: "Metalúrgica Rio Verde", telefone: "(42) 3025-5555", tipo: "PJ", cidade: "Telêmaco Borba/PR", ordens: 11 },
]

export const mockEquipamentos: Equipamento[] = [
  { id: "1", tipo: "Torno Mecânico", marca: "Romi", modelo: "Centur 30D", cliente: "João Silva", serie: "RM-30D-0871" },
  { id: "2", tipo: "Furadeira", marca: "Schulz", modelo: "FBM 160", cliente: "Oficina do Beto", serie: "SZ-160-4412" },
  { id: "3", tipo: "Motor Elétrico", marca: "WEG", modelo: "W22 Plus", cliente: "Indústria Apex", serie: "WG-W22-1093" },
  { id: "4", tipo: "Compressor", marca: "Chiaperini", modelo: "20 PCM APV", cliente: "Metalúrgica Rio Verde", serie: "CH-20A-7730" },
  { id: "5", tipo: "Serra Circular", marca: "Makita", modelo: "5007N", cliente: "Maria Souza", serie: "MK-5007-2214" },
  { id: "6", tipo: "Compressor", marca: "Schulz", modelo: "CSL 20BR", cliente: "Indústria Apex", serie: "SZ-CSL-5521" },
]

// Novos dados baseados na modelagem de NotificacaoCliente e precificação base
export const mockServicos: Servico[] = [
  { id: "SRV-01", nome: "Troca de Rolamento", descricao: "Mão de obra para substituição de rolamentos padrão", valorBase: "R$ 150,00" },
  { id: "SRV-02", nome: "Revisão Geral", descricao: "Limpeza, lubrificação e testes elétricos", valorBase: "R$ 80,00" },
  { id: "SRV-03", nome: "Rebobinamento Trifásico", descricao: "Serviço de rebobinamento de estator trifásico", valorBase: "R$ 450,00" },
  { id: "SRV-04", nome: "Usinagem de Eixo", descricao: "Recuperação e retífica de eixo em torno mecânico", valorBase: "R$ 320,00" },
  { id: "SRV-05", nome: "Diagnóstico Técnico", descricao: "Avaliação inicial com laudo e orçamento", valorBase: "R$ 60,00" },
]

export const mockNotificacoes: Notificacao[] = [
  { id: "NOT-501", os: "OS-1042", cliente: "João Silva", tipo: "PRAZO_INICIADO", status: "ENVIADO", data: "30/05/2026 09:15" },
  { id: "NOT-502", os: "OS-1041", cliente: "Oficina do Beto", tipo: "PRAZO_ENCERRADO", status: "ENVIADO", data: "28/05/2026 14:30" },
  { id: "NOT-503", os: "OS-1039", cliente: "Indústria Apex", tipo: "PERSONALIZADO", status: "FALHOU", data: "27/05/2026 11:10" },
  { id: "NOT-504", os: "OS-1040", cliente: "Maria Souza", tipo: "PERSONALIZADO", status: "PENDENTE", data: "30/05/2026 10:00" },
  { id: "NOT-505", os: "OS-1038", cliente: "Metalúrgica Rio Verde", tipo: "PRAZO_ENCERRADO", status: "ENVIADO", data: "26/05/2026 16:45" },
]
