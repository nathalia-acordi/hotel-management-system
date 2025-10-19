import { sign as signRaw } from './tokenAdapter.js';

export class JwtTokenService {
  sign(payload, options) {
    return signRaw(payload, options);
  }
}

export default JwtTokenService;
