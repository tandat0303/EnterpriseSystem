const TOKEN_KEY = "authToken"

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) || undefined
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
