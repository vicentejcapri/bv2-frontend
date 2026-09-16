/**
 * Avisa as outras abas do navegador que a senha ou o e-mail de uma conta mudou.
 *
 * A sessão mora no sessionStorage, que é por aba — e o link de confirmação do e-mail
 * abre numa aba nova. Sem este aviso, a aba que já estava logada só descobriria que o
 * token caiu na próxima chamada à API. A mensagem não diz de quem é a conta: cada aba
 * confere o próprio token no backend e só sai se ele tiver deixado de valer, então
 * abas de outro usuário continuam intactas.
 */
const NOME_CANAL = "bv2:credenciais"

export function avisarCredenciaisAlteradas() {
  if (typeof BroadcastChannel === "undefined") return
  const canal = new BroadcastChannel(NOME_CANAL)
  canal.postMessage("alteradas")
  canal.close()
}

export function ouvirCredenciaisAlteradas(callback: () => void) {
  if (typeof BroadcastChannel === "undefined") return () => {}
  const canal = new BroadcastChannel(NOME_CANAL)
  canal.onmessage = () => callback()
  return () => canal.close()
}
