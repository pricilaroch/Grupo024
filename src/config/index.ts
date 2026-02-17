/**
 * Constantes de configuração da aplicação.
 */
export const config = {
  /** Número de rounds para o bcrypt gerar o salt */
  bcryptSaltRounds: 10,

  /** Segredo para assinatura do JWT */
  jwtSecret: process.env.JWT_SECRET || 'pds-grupo024-jwt-secret-2026',

  /** Tempo de expiração do token JWT */
  jwtExpiresIn: '24h',

  /** Porta do servidor */
  port: Number(process.env.PORT) || 3000,
} as const;
