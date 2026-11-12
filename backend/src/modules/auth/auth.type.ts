export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  status: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
}


declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      authSessionId?: string;
    }
  }
}