import { useState } from "react"
import type { FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogForm,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "./Field"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { fieldProps } from "@/lib/form"
import { atualizarUsuario, criarUsuario } from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"
import { ComAjuda } from "@/components/Ajuda"
import { AJUDA } from "@/config/ajuda"

type Erros = Partial<Record<"nome" | "email" | "senha" | "geral", string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Cadastro e edição de usuário do sistema. Com `usuario` edita (PUT, só o nome);
 * sem ele cadastra (POST), sempre como ADMIN. E-mail e senha de outro usuário não
 * mudam por aqui: cada um troca os seus com prova de posse.
 */
export function UsuarioDialog({
  open,
  onOpenChange,
  usuario,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  usuario?: Usuario
  onSalvo: (usuario: Usuario, criado: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        <UsuarioForm
          usuario={usuario}
          onSalvo={(salvo) => {
            onSalvo(salvo, !usuario)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function UsuarioForm({
  usuario,
  onSalvo,
}: {
  usuario?: Usuario
  onSalvo: (usuario: Usuario) => void
}) {
  const { token, logout } = useAuth()
  const [nome, setNome] = useState(usuario?.nome ?? "")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    // Mesmas regras do UsuarioCriacaoRequest / UsuarioAtualizacaoRequest.
    const nomeLimpo = nome.trim()
    const emailLimpo = email.trim()
    const locais: Erros = {
      nome: !nomeLimpo
        ? "Informe o nome do usuário."
        : nomeLimpo.length > 50
          ? "O nome deve ter no máximo 50 caracteres."
          : undefined,
    }
    if (!usuario) {
      locais.email = !emailLimpo
        ? "Informe o e-mail de acesso."
        : !EMAIL.test(emailLimpo)
          ? "E-mail em formato inválido."
          : emailLimpo.length > 50
            ? "O e-mail deve ter no máximo 50 caracteres."
            : undefined
      locais.senha =
        senha.length < 8 || senha.length > 72
          ? "A senha deve ter entre 8 e 72 caracteres."
          : undefined
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      onSalvo(
        usuario
          ? await atualizarUsuario(token, usuario.id, nomeLimpo)
          : await criarUsuario(token, { nome: nomeLimpo, email: emailLimpo, senha })
      )
    } catch (error) {
      setEnviando(false)
      if (error instanceof ApiError && error.status === 401) return logout()
      if (error instanceof ApiError && error.status === 400 && error.erros) {
        return setErros({ ...error.erros })
      }
      if (error instanceof ApiError && error.status === 409) {
        return setErros({ email: "Já existe um usuário com esse e-mail." })
      }
      setErros({
        geral:
          error instanceof ApiError
            ? error.message
            : "Algo deu errado. Tente novamente.",
      })
    }
  }

  return (
    <DialogForm onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <ComAjuda conteudo={AJUDA.usuario} className="pr-8">
          <DialogTitle>{usuario ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </ComAjuda>
        <DialogDescription>
          {usuario
            ? "Só o nome muda por aqui. E-mail e senha são trocados pelo próprio usuário, no perfil."
            : "O usuário entra como administrador, com uma base própria e vazia de clientes, serviços e ordens."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <Field id="usuario-nome" label="Nome" required error={erros.nome}>
          <Input
            {...fieldProps("usuario-nome", erros.nome)}
            value={nome}
            maxLength={50}
            onChange={(event) => setNome(event.target.value)}
            placeholder="M2 Equipamentos"
            autoFocus
          />
        </Field>

        {usuario ? (
          <Field id="usuario-email" label="E-mail">
            <Input id="usuario-email" value={usuario.email} disabled />
          </Field>
        ) : (
          <>
            <Field id="usuario-email" label="E-mail" required error={erros.email}>
              <Input
                {...fieldProps("usuario-email", erros.email)}
                type="email"
                inputMode="email"
                autoComplete="off"
                value={email}
                maxLength={50}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contato@empresa.com"
              />
            </Field>

            <Field id="usuario-senha" label="Senha inicial" required error={erros.senha}>
              <PasswordInput
                {...fieldProps("usuario-senha", erros.senha)}
                autoComplete="new-password"
                value={senha}
                maxLength={72}
                onChange={(event) => setSenha(event.target.value)}
              />
            </Field>
          </>
        )}

        {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {usuario ? "Salvar alterações" : "Cadastrar usuário"}
        </Button>
      </DialogFooter>
    </DialogForm>
  )
}
