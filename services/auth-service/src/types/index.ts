export interface RegisterBody {
  email: string
  password: string
  username: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface JWTPayload {
  userId: number
  email: string
}
