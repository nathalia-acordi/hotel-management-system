import axios from 'axios';










export async function post(url, data) {
  try {
    
    
    
    const response = await axios.post(url, data);
    return response.data;

  } catch (err) {

    
    
    
    
    
    
    
    const safe = {
      url,                           
      status: err?.response?.status, 
      message: err?.message,         
    };

    
    
    if (process.env.NODE_ENV !== 'production') {
      const respData = err?.response?.data;
      
      if (respData && typeof respData !== 'object') {
        safe.responseData = String(respData);
      }
    }

    
    console.error('[HTTP ADAPTER] Erro ao fazer POST:', safe);

    
    
    throw err;
  }
}
