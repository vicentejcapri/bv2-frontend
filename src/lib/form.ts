/**
 * Props de acessibilidade de um controle validado: amarra o id ao <Label> e,
 * havendo erro, aponta o aria-describedby para a mensagem renderizada pelo
 * <Field> — que também dispara os estilos `aria-[invalid=true]`.
 */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const
}
