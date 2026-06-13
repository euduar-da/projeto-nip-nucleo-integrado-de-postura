
export async function loginApi(email: string, senha: string) {
  const response = await fetch("http://localhost:8000/api/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.erro || "Erro ao fazer login.");
  }

  return data; 
}