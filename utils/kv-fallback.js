import googleSheetsDB from './google-sheets.js';

// Fallback simples em memória para desenvolvimento local
class MemoryKV {
  constructor() {
    this.data = new Map();
  }

  async hget(key, field) {
    const hash = this.data.get(key) || {};
    return hash[field] || null;
  }

  async hset(key, data) {
    const hash = this.data.get(key) || {};
    if (typeof data === 'object') {
      Object.assign(hash, data);
    } else {
      // Se data não for um objeto, assumir que é um valor único
      hash.value = data;
    }
    this.data.set(key, hash);
    return true;
  }

  async hincrby(key, field, increment) {
    const hash = this.data.get(key) || {};
    const currentValue = parseFloat(hash[field] || 0);
    hash[field] = currentValue + parseFloat(increment);
    this.data.set(key, hash);
    return hash[field];
  }

  async lpush(key, value) {
    const list = this.data.get(key) || [];
    list.unshift(value);
    this.data.set(key, list);
    return list.length;
  }

  async lrange(key, start, stop) {
    const list = this.data.get(key) || [];
    return list.slice(start, stop + 1);
  }
}

const memoryKV = new MemoryKV();

// Função para verificar configuração do Google Sheets de forma lazy
function getKV() {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  
  const hasGoogleSheetsConfig = sheetsId && serviceAccountPath;
  
  if (hasGoogleSheetsConfig) {
    return googleSheetsDB;
  } else {
    return memoryKV;
  }
}

// Proxy para chamar getKV() apenas quando necessário
const kv = new Proxy({}, {
  get(target, prop) {
    const kvInstance = getKV();
    
    if (typeof kvInstance[prop] === 'function') {
      return function(...args) {
        return kvInstance[prop].apply(kvInstance, args);
      };
    }
    
    return kvInstance[prop];
  }
});

export { kv };