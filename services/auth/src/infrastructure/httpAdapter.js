import axios from 'axios';

export async function post(url, data) {
  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (err) {
  // Evite logar objetos de resposta completos para prevenir problemas de JSON circular em workers do Jest
    const safe = {
      url,
      status: err?.response?.status,
      message: err?.message,
    };
    if (process.env.NODE_ENV !== 'production') {
  // incluir dados mínimos de resposta quando pequenos e simples
      const respData = err?.response?.data;
      if (respData && typeof respData !== 'object') safe.responseData = String(respData);
    }
    console.error('[HTTP ADAPTER] Erro ao fazer POST:', safe);
    throw err;
  }
}