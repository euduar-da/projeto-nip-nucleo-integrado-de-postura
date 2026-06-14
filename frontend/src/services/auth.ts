const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
)
  .replace(/\/$/, "");

type LoginResponse = {
  token: string;
  perfil?: string;
  tipo?: string;
  nome?: string;
  email?: string;
};

function limparToken(token: string) {
  return token
    .replace(/^Token\s+/i, "")
    .replace(/^Bearer\s+/i, "")
    .replaceAll('"', "")
    .trim();
}

async function lerRespostaApi(response: Response) {
  const texto = await response.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("A API não retornou JSON. Verifique se a URL está correta.");
  }
}

function formatarErroApi(data: any, mensagemPadrao: string) {
  if (!data) return mensagemPadrao;

  if (typeof data === "string") return data;

  if (typeof data.erro === "string") return data.erro;

  if (typeof data.detail === "string") return data.detail;

  if (data.erro && typeof data.erro === "object") {
    return Object.entries(data.erro)
      .map(([campo, mensagens]) => {
        if (Array.isArray(mensagens)) {
          return `${campo}: ${mensagens.join(", ")}`;
        }

        return `${campo}: ${String(mensagens)}`;
      })
      .join(" | ");
  }

  return mensagemPadrao;
}

export async function loginApi(email: string, senha: string) {
  const response = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const data: LoginResponse | any = await lerRespostaApi(response);

  if (!response.ok) {
    throw new Error(formatarErroApi(data, "Erro ao fazer login."));
  }

  const token = limparToken(data.token);

  localStorage.setItem("nip_token", token);

  localStorage.setItem(
    "nip_user",
    JSON.stringify({
      token,
      perfil: data.perfil,
      tipo: data.tipo,
      nome: data.nome,
      email: data.email,
    })
  );

  if (data.perfil) {
    localStorage.setItem("perfil", data.perfil);
  }

  if (data.nome) {
    localStorage.setItem("nome", data.nome);
  }

  if (data.email) {
    localStorage.setItem("email", data.email);
  }

  return data;
}

export function getAuthToken() {
  const chavesDiretas = ["nip_token", "token", "authToken", "access"];

  for (const chave of chavesDiretas) {
    const valor = localStorage.getItem(chave);

    if (valor && valor.trim()) {
      return limparToken(valor);
    }
  }

  const chavesUsuario = ["nip_user", "usuario", "user"];

  for (const chave of chavesUsuario) {
    const valor = localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const usuario = JSON.parse(valor);

      if (usuario?.token) {
        return limparToken(String(usuario.token));
      }
    } catch {
      continue;
    }
  }

  return "";
}

export function getAuthHeaders() {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  return headers;
}

export function getUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("nip_user");

  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo);
  } catch {
    return null;
  }
}

export function getPerfilUsuario() {
  const usuario = getUsuarioLogado();

  return (
    usuario?.perfil ||
    usuario?.tipo ||
    localStorage.getItem("perfil") ||
    ""
  );
}

export function usuarioEhPaciente() {
  return getPerfilUsuario().toLowerCase().includes("paciente");
}

export function limparSessaoLocal() {
  localStorage.removeItem("nip_token");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("access");

  localStorage.removeItem("nip_user");
  localStorage.removeItem("usuario");
  localStorage.removeItem("user");

  localStorage.removeItem("perfil");
  localStorage.removeItem("nome");
  localStorage.removeItem("email");
}

export async function logoutApi() {
  const token = getAuthToken();

  try {
    if (token) {
      await fetch(`${API_URL}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
    }
  } finally {
    limparSessaoLocal();
  }
}