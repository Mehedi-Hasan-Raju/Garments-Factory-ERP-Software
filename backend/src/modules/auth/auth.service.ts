import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { AppError } from "../../lib/app-error.js";
import { authRepository } from "./auth.repository.js";
import { AUTH_CONSTANTS } from "./auth.constant.js";
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  AuthTokens,
} from "./auth.type.js";
import type { LoginInput } from "./auth.validation.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not configured");
}

// Hash refresh token before database storage
const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

// Generate a secure refresh token
const generateRefreshToken = (): string => {
  return randomBytes(
    AUTH_CONSTANTS.REFRESH_TOKEN_BYTES
  ).toString("hex");
};

// Convert database user into a safe response object
const formatUser = (user: NonNullable<
  Awaited<ReturnType<typeof authRepository.findUserByEmail>>
>): AuthenticatedUser => {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    role: {
      id: user.role.id,
      name: user.role.name,
      code: user.role.code,
      permissions: user.role.permissions.map(
        (item) => item.permission.code
      ),
    },
  };
};

// Generate access token
const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
  });
};

// Calculate refresh token expiry
const getRefreshTokenExpiry = (): Date => {
  return new Date(
    Date.now() +
      AUTH_CONSTANTS.REFRESH_TOKEN_DAYS *
        24 *
        60 *
        60 *
        1000
  );
};

export const authService = {
  // Login
  async login(
    input: LoginInput,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{
    user: AuthenticatedUser;
    tokens: AuthTokens;
  }> {
    const user = await authRepository.findUserByEmail(
      input.email
    );

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Your account is not active", 403);
    }
    if (!user.role.isActive) {
   throw new AppError("Your assigned role is not active", 403);
   }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const refreshToken = generateRefreshToken();

    const session = await authRepository.createLoginSession({
       userId: user.id,
       refreshTokenHash: hashRefreshToken(refreshToken),
       expiresAt: getRefreshTokenExpiry(),
       ipAddress: metadata.ipAddress,
       userAgent: metadata.userAgent,
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    return {
      user: formatUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  },


  // Refresh access token and rotate refresh token atomically
  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const currentHash = hashRefreshToken(refreshToken);

    const session =
      await authRepository.findSessionByRefreshToken(currentHash);

    if (!session || session.revokedAt) {
      throw new Error("Invalid refresh token");
    }

    if (session.expiresAt <= new Date()) {
      throw new Error("Refresh token has expired");
    }

    if (session.user.status !== "ACTIVE") {
      throw new Error("Your account is not active");
    }

    if (!session.user.role.isActive) {
      throw new Error("Your assigned role is not active");
    }

    const newRefreshToken = generateRefreshToken();

    const newSession = await authRepository.rotateSession({
      sessionId: session.id,
      currentRefreshTokenHash: currentHash,
      newRefreshTokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: getRefreshTokenExpiry(),
    });

    if (!newSession) {
      throw new Error("Refresh token has already been used or revoked");
    }

    const newAccessToken = generateAccessToken({
      userId: session.userId,
      sessionId: newSession.id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },


  // Logout
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const session = await authRepository.findSessionByRefreshToken(
      hashRefreshToken(refreshToken)
    );

    if (!session || session.revokedAt) {
      return;
    }

    await authRepository.revokeSession(session.id);
  },

// Authenticate access token with database session
async authenticateAccessToken(token: string): Promise<{
  user: AuthenticatedUser;
  sessionId: string;
}> {
  const payload = authService.verifyAccessToken(token);

  const session = await authRepository.findSessionById(
    payload.sessionId
  );

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.userId !== payload.userId) {
    throw new Error("Invalid session");
  }

  if (session.revokedAt) {
    throw new Error("Session has been revoked");
  }

  if (session.expiresAt <= new Date()) {
    throw new Error("Session has expired");
  }

  if (session.user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  return {
    user: formatUser(session.user),
    sessionId: session.id,
  };
},


  // Verify access token
  verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(
    token,
    JWT_ACCESS_SECRET,
    { algorithms: ["HS256"] }
  ) as AccessTokenPayload;

  if (
    typeof decoded.userId !== "string" ||
    typeof decoded.sessionId !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return decoded;
},
};
