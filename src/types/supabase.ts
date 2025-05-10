export type User = {
  id: string;
  email?: string;
  created_at?: string;
};

export type AuthError = {
  message: string;
};

export type AuthResponse = {
  error: AuthError | null;
  data: {
    user: User | null;
    session: any | null;
  } | null;
};