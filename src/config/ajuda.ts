/**
 * Textos do botão de ajuda (o "izinho") de cada tela, modal e formulário.
 * Fonte única: ao mudar uma regra na tela, ajuste o texto aqui junto.
 */
export type ConteudoAjuda = {
  titulo: string
  /** O que se faz nesta tela, em uma ou duas frases. */
  texto: string
  /** Passos e regras que costumam gerar dúvida. */
  itens?: string[]
}

export const AJUDA = {
  // ---------------------------------------------------------------- Acesso
  login: {
    titulo: "Como entrar",
    texto: "Informe o e-mail e a senha da sua conta e clique em Entrar.",
    itens: [
      "O e-mail é o mesmo cadastrado pela equipe BV2 ou o que você trocou no seu perfil.",
      "Esqueceu a senha? Use “Esqueci minha senha” para receber um link de redefinição no e-mail.",
      "Use o ícone de olho para conferir a senha antes de enviar.",
    ],
  },
  esqueciSenha: {
    titulo: "Recuperar o acesso",
    texto:
      "Digite o e-mail da sua conta. Se ele estiver cadastrado, você recebe um link para criar uma senha nova.",
    itens: [
      "Confira também a caixa de spam.",
      "O link vale por tempo limitado e só pode ser usado uma vez. Se expirar, peça outro por aqui.",
    ],
  },
  redefinirSenha: {
    titulo: "Criar a nova senha",
    texto: "Escolha a nova senha e repita no campo de confirmação.",
    itens: [
      "Mínimo de 8 caracteres.",
      "Os dois campos precisam ser iguais.",
      "A nova senha não pode ser igual à atual.",
      "Depois de salvar, entre de novo com a senha nova.",
    ],
  },

  // ---------------------------------------------------------------- Layout
  conta: {
    titulo: "Conta em que você está operando",
    texto:
      "Cada usuário tem a própria base de clientes, equipamentos, serviços e ordens. Escolha aqui de qual conta são os dados que você vê e altera.",
    itens: [
      "Tudo o que você cadastrar, editar ou excluir vale para a conta selecionada.",
      "Ao trocar de conta, a tela recarrega com os dados da nova conta.",
      "Só aparecem contas de usuários ativos.",
    ],
  },

  // ---------------------------------------------------------------- Telas
  dashboard: {
    titulo: "Como ler o dashboard",
    texto:
      "Indicadores de faturamento e da operação no período escolhido. Use o seletor de período, no canto direito, para mudar o recorte.",
    itens: [
      "No calendário, toque no dia inicial e depois no final, ou use os atalhos (30 dias, 90 dias, 12 meses, Este ano).",
      "Faturamento realizado: soma das ordens de serviço entregues no período.",
      "Faturamento em aberto: ordens em andamento e concluídas que ainda não foram entregues.",
      "Ticket médio: valor médio por ordem entregue.",
      "Os gráficos e rankings mostram a evolução mês a mês e os serviços, clientes e marcas que mais aparecem.",
    ],
  },
  ordensServico: {
    titulo: "Como usar as ordens de serviço",
    texto:
      "Aqui você abre, acompanha e encerra as ordens de serviço. A lista começa mostrando só as que estão em aberto.",
    itens: [
      "Nova ordem de serviço: escolha o cliente, os equipamentos e os serviços feitos em cada um.",
      "Clique no status de uma ordem para mudá-lo. O caminho é: Em andamento → Concluído → Entregue. Cancelar é possível até a entrega.",
      "Entregues e canceladas não mudam mais de status. Para vê-las, troque o filtro de status.",
      "Passe o mouse na linha e clique no ícone de informação para ver os itens e ajustar o valor total.",
      "A lixeira só aparece para ordens em andamento ou canceladas.",
      "Se as notificações estiverem ligadas, o cliente recebe WhatsApp ao concluir, entregar ou cancelar.",
    ],
  },
  clientes: {
    titulo: "Como usar os clientes",
    texto:
      "Cadastre as pessoas e empresas atendidas pela oficina. Todo equipamento e toda ordem de serviço pertencem a um cliente.",
    itens: [
      "Novo cliente: informe nome e telefone com DDD.",
      "Busque pelo nome ou pelo telefone. Por padrão a lista mostra só os ativos.",
      "A chave Ativo tira o cliente de uso sem apagar o histórico: inativos não aparecem para novas ordens nem novos equipamentos.",
      "No menu ⋯ da linha você edita ou exclui. Cliente com equipamentos, ordens ou notificações não pode ser excluído — inative-o.",
    ],
  },
  equipamentos: {
    titulo: "Como usar os equipamentos",
    texto:
      "Cadastre as máquinas dos clientes. Cada equipamento pertence a um cliente e pode entrar em várias ordens de serviço.",
    itens: [
      "Novo equipamento: informe nome, marca e cliente. Se a marca não existir, crie-a na própria lista de marcas.",
      "Busque por nome do equipamento, marca ou cliente.",
      "No menu ⋯ da linha você edita ou exclui. Equipamento que já aparece em ordem de serviço não pode ser excluído.",
      "Você também pode cadastrar um equipamento direto da tela de nova ordem de serviço.",
    ],
  },
  servicos: {
    titulo: "Como usar os serviços",
    texto:
      "Monte a tabela de preços da oficina. Ao lançar um serviço numa ordem, o valor dele entra na soma do total.",
    itens: [
      "Novo serviço: informe nome, valor e, se quiser, uma descrição do que está incluso.",
      "O nome do serviço não pode se repetir.",
      "A chave Ativo tira o serviço das novas ordens sem afetar as que já o usam.",
      "No menu ⋯ da linha você edita ou exclui. Serviço que já aparece em ordem de serviço não pode ser excluído — inative-o.",
    ],
  },
  notificacoes: {
    titulo: "Como funcionam as notificações",
    texto:
      "Histórico das mensagens de WhatsApp enviadas automaticamente aos clientes quando uma ordem de serviço muda de status.",
    itens: [
      "Em Gerenciar notificações você escolhe em quais mudanças de status o cliente é avisado.",
      "Os cartões mostram quantos envios foram confirmados, estão na fila ou falharam no período escolhido.",
      "Filtre pelo período e pelo resultado do envio, ou busque por cliente, número da ordem ou texto da mensagem.",
      "Envio com falha: confira o telefone do cliente e, se preciso, avise-o por outro meio.",
    ],
  },
  usuarios: {
    titulo: "Como usar os usuários",
    texto:
      "Cadastre quem acessa o sistema. Cada usuário novo entra como administrador, com uma base própria e vazia.",
    itens: [
      "Novo usuário: informe nome, e-mail e senha inicial e repasse os dados à pessoa. Ela pode trocar e-mail e senha no perfil.",
      "A chave Ativo bloqueia ou libera o acesso sem apagar nada.",
      "Excluir apaga a conta inteira (clientes, equipamentos, serviços, ordens e notificações) e pede confirmação digitando EXCLUIR.",
      "O usuário da equipe BV2 é único: não pode ser desativado nem excluído.",
      "Para trabalhar na base de um usuário, escolha a conta dele no seletor do topo.",
    ],
  },

  // ---------------------------------------------------------------- Modais
  novaOS: {
    titulo: "Como abrir uma ordem de serviço",
    texto:
      "Preencha cliente, data de entrada e pelo menos um item (equipamento + serviço). A ordem nasce em andamento.",
    itens: [
      "Cliente: digite parte do nome ou do telefone. Se ele não existir, crie-o pela própria lista.",
      "Cada item liga um equipamento do cliente a um serviço feito nele. Use “Adicionar item” para lançar mais.",
      "Equipamento ou serviço novo pode ser criado direto nas listas, sem sair da ordem.",
      "O mesmo serviço não pode ser lançado duas vezes para o mesmo equipamento.",
      "O valor total é a soma dos serviços. Use o lápis para fixar outro valor (desconto, preço fechado) e “Voltar ao automático” para desfazer.",
      "A data de entrada não pode ser futura.",
    ],
  },
  detalhesOS: {
    titulo: "Detalhes da ordem de serviço",
    texto:
      "Mostra o cliente, o status, os equipamentos com os serviços lançados e o valor total.",
    itens: [
      "O status é alterado na lista, clicando nele.",
      "Enquanto a ordem está em andamento, o lápis ao lado do valor total permite fixar outro valor.",
      "Um valor fixado não acompanha mais a soma dos serviços. Use “Voltar ao valor automático” para desfazer.",
      "Concluídas, entregues e canceladas ficam só para consulta.",
    ],
  },
  cliente: {
    titulo: "Como preencher o cliente",
    texto: "Informe o nome e o telefone com DDD. O +55 já está incluso.",
    itens: [
      "O telefone é o número que recebe os avisos de WhatsApp, por isso confira com atenção.",
      "Se já existir um cliente com o mesmo nome e telefone, o sistema avisa antes de salvar.",
    ],
  },
  equipamento: {
    titulo: "Como preencher o equipamento",
    texto: "Informe o nome do equipamento, a marca e o cliente dono dele.",
    itens: [
      "Marca nova? Escolha “Criar nova marca” no fim da lista, digite o nome e clique em Criar.",
      "Cliente: digite parte do nome ou do telefone. Só aparecem clientes ativos.",
      "Na edição o cliente não pode ser trocado: o histórico de ordens é do equipamento.",
    ],
  },
  servico: {
    titulo: "Como preencher o serviço",
    texto: "Informe o nome, o valor e, se quiser, a descrição do que está incluso.",
    itens: [
      "O valor é a referência da tabela. Em cada ordem de serviço o total pode ser ajustado à mão.",
      "Mudar o valor aqui não altera ordens de serviço que já existem.",
    ],
  },
  usuario: {
    titulo: "Como preencher o usuário",
    texto:
      "No cadastro, informe nome, e-mail e senha inicial. Na edição, só o nome pode ser alterado.",
    itens: [
      "O e-mail é o login da pessoa e não pode estar em uso por outro usuário.",
      "A senha inicial precisa ter no mínimo 8 caracteres. Repasse-a à pessoa, que pode trocá-la no perfil.",
      "O usuário nasce como administrador, com a base vazia e as notificações desligadas.",
    ],
  },
  gerenciarNotificacoes: {
    titulo: "Como gerenciar as notificações",
    texto:
      "Ligue ou desligue o WhatsApp automático para cada mudança de status da ordem de serviço e clique em Salvar.",
    itens: [
      "Ligado: o cliente recebe a mensagem quando a ordem muda para aquele status.",
      "“Ver a mensagem” mostra um exemplo do texto enviado, com dados fictícios no lugar dos reais.",
      "O texto vem de um modelo aprovado pelo WhatsApp e não pode ser editado aqui.",
      "As mudanças só valem depois de salvar.",
    ],
  },
  perfil: {
    dados: {
      titulo: "Seus dados",
      texto: "Altere o nome que aparece no sistema e clique em Salvar.",
    },
    email: {
      titulo: "Trocar o e-mail",
      texto:
        "Digite o novo e-mail duas vezes e a sua senha atual. Um link de confirmação é enviado ao novo endereço.",
      itens: [
        "O e-mail é o seu login. A troca só vale depois de clicar no link de confirmação.",
        "Até confirmar, continue entrando com o e-mail atual.",
      ],
    },
    senha: {
      titulo: "Trocar a senha",
      texto:
        "Digite a senha atual e a nova senha duas vezes. Um link de confirmação é enviado ao seu e-mail.",
      itens: [
        "A nova senha precisa ter no mínimo 8 caracteres.",
        "A troca só vale depois de clicar no link. Aí todas as sessões abertas são encerradas e você entra de novo com a senha nova.",
      ],
    },
  },
  excluir: {
    titulo: "Antes de excluir",
    texto:
      "A exclusão é definitiva e não pode ser desfeita. Confira o nome do registro antes de confirmar.",
    itens: [
      "Se o registro já tem histórico ligado a ele, o sistema bloqueia a exclusão e explica o motivo.",
      "Para só tirar de uso sem perder o histórico, prefira inativar (clientes, serviços, usuários) ou cancelar (ordens de serviço).",
    ],
  },
} satisfies Record<string, ConteudoAjuda | Record<string, ConteudoAjuda>>
