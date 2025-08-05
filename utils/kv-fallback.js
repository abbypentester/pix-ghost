// Fallback para Vercel KV usando armazenamento em memória
let kvInstance = null;
let useMemoryFallback = true;
const memoryStore = new Map();

// Verificar se as variáveis do Vercel KV estão configuradas
function checkKVConfig() {
    return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
}

// Criar fallback em memória
function createKVFallback() {
    return {
        async hget(key, field) {
            const hashKey = `${key}:${field}`;
            return memoryStore.get(hashKey) || null;
        },
        
        async hset(key, field, value) {
            if (typeof field === 'object') {
                // Se field é um objeto, definir múltiplos campos
                for (const [f, v] of Object.entries(field)) {
                    const hashKey = `${key}:${f}`;
                    memoryStore.set(hashKey, v);
                }
            } else {
                // Definir um único campo
                const hashKey = `${key}:${field}`;
                memoryStore.set(hashKey, value);
            }
            return 'OK';
        },
        
        async lpush(key, value) {
            const list = memoryStore.get(key) || [];
            list.unshift(value);
            memoryStore.set(key, list);
            return list.length;
        },
        
        async lrange(key, start, stop) {
            const list = memoryStore.get(key) || [];
            if (stop === -1) {
                return list.slice(start);
            }
            return list.slice(start, stop + 1);
        },
        
        async get(key) {
            return memoryStore.get(key) || null;
        },
        
        async set(key, value) {
            memoryStore.set(key, value);
            return 'OK';
        },
        
        async del(key) {
            const existed = memoryStore.has(key);
            memoryStore.delete(key);
            return existed ? 1 : 0;
        }
    };
}

// Inicializar o KV
async function initializeKV() {
    if (kvInstance) return kvInstance;
    
    if (checkKVConfig()) {
        try {
            const { kv: vercelKV } = await import('@vercel/kv');
            kvInstance = vercelKV;
            useMemoryFallback = false;
            console.log('✅ Usando Vercel KV para armazenamento');
            return kvInstance;
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar Vercel KV, usando fallback em memória:', error.message);
            useMemoryFallback = true;
        }
    } else {
        console.log('🔄 Variáveis do Vercel KV não configuradas, usando fallback em memória');
        useMemoryFallback = true;
    }
    
    kvInstance = createKVFallback();
    return kvInstance;
}

// Exportar uma instância lazy do KV
export const kv = {
    async hget(key, field) {
        const instance = await initializeKV();
        return instance.hget(key, field);
    },
    
    async hset(key, field, value) {
        const instance = await initializeKV();
        return instance.hset(key, field, value);
    },
    
    async lpush(key, value) {
        const instance = await initializeKV();
        return instance.lpush(key, value);
    },
    
    async lrange(key, start, stop) {
        const instance = await initializeKV();
        return instance.lrange(key, start, stop);
    },
    
    async get(key) {
        const instance = await initializeKV();
        return instance.get(key);
    },
    
    async set(key, value) {
        const instance = await initializeKV();
        return instance.set(key, value);
    },
    
    async del(key) {
        const instance = await initializeKV();
        return instance.del(key);
    }
};

export default kv;