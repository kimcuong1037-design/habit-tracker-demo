import { api } from "./client.js";

interface AuthResponse {
  data: {
    user: { id: string; username: string; createdAt: string };
    token: string;
  };
}

export async function register(username: string, password: string) {
  const res = await api.post<AuthResponse>("/api/auth/register", {
    username,
    password,
  });
  return res.data;
}

export async function login(username: string, password: string) {
  const res = await api.post<AuthResponse>("/api/auth/login", {
    username,
    password,
  });
  return res.data;
}
