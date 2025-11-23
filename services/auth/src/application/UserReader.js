import axios from 'axios';
export default class UserReader {
  constructor(baseUrl) {
    
    this.baseUrl = baseUrl || process.env.USER_SERVICE_URL || 'http://localhost:3000';
  }

  async validateCredentials(username, password) {
    try {
      const { data } = await axios.post(`${this.baseUrl}/validate`, { username, password }, { timeout: 5000 });
      if (!data || data.valid !== true) return null;
      return { id: data.id, username: data.username || username, role: data.role };
    } catch {
      return null;
    }
  }
  
  async findByEmailOrUsername(identifier, isEmail, password) {
    if (isEmail) {
    
      return null;
    }
    return await this.validateCredentials(identifier, password);
  }
}
