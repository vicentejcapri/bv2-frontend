import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"

const STORAGE_KEY = "bv2:logged-in"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true"
  )

  const login = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "true")
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setIsLoggedIn(false)
  }, [])

  const value = useMemo(
    () => ({ isLoggedIn, login, logout }),
    [isLoggedIn, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
