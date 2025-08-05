import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

class GoogleSheetsDB {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔧 Inicializando Google Sheets...');
      
      // Carregar variáveis de ambiente no momento da inicialização
      this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      
      // Verificar variáveis de ambiente
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_ID não configurado');
      }
      
      console.log('📊 GOOGLE_SHEETS_ID encontrado:', this.spreadsheetId);
      
      // Configurar autenticação usando service account
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './google-service-account.json';
      console.log('📁 Caminho do service account:', serviceAccountPath);
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Arquivo de service account não encontrado: ${serviceAccountPath}`);
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets API inicializada');
      
      // Verificar se as abas necessárias existem
      await this.ensureSheetStructure();
      
      this.initialized = true;
      console.log('🎉 Google Sheets configurado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Sheets:', error.message);
      this.sheets = null;
      this.initialized = false;
      throw error;
    }
  }

  async ensureSheetStructure() {
    try {
      // Verificar se as abas existem
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
      const requiredSheets = ['usuarios', 'transacoes', 'saques_pendentes'];

      for (const sheetName of requiredSheets) {
        if (!sheetNames.includes(sheetName)) {
          await this.createSheet(sheetName);
        }
      }

      // Configurar cabeçalhos se necessário
      await this.setupHeaders();
    } catch (error) {
      console.error('Erro ao verificar estrutura das planilhas:', error);
    }
  }

  async createSheet(sheetName) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      console.log(`Aba '${sheetName}' criada com sucesso`);
    } catch (error) {
      console.error(`Erro ao criar aba '${sheetName}':`, error);
    }
  }

  async setupHeaders() {
    const headers = {
      'usuarios': ['userId', 'balance', 'created_at', 'updated_at'],
      'transacoes': ['transactionId', 'userId', 'type', 'amount', 'paymentId', 'timestamp', 'status'],
      'saques_pendentes': ['transactionId', 'userId', 'pixKey', 'amount', 'netAmount', 'fee', 'timestamp', 'status', 'admin_approval', 'admin_notes', 'processed_at']
    };

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      try {
        // Verificar se já existem cabeçalhos
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1:Z1`
        });

        if (!response.data.values || response.data.values.length === 0) {
          // Adicionar cabeçalhos
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            resource: {
              values: [headerRow]
            }
          });
          console.log(`Cabeçalhos adicionados à aba '${sheetName}'`);
        }
      } catch (error) {
        console.error(`Erro ao configurar cabeçalhos para '${sheetName}':`, error);
      }
    }
  }

  // Métodos compatíveis com a interface KV
  async hget(key, field) {
    await this.initialize();
    
    if (key.startsWith('user:')) {
      const userId = key.split(':')[1];
      return await this.getUserField(userId, field);
    }
    
    if (key.startsWith('transaction:')) {
      const transactionId = key.split(':')[1];
      return await this.getTransactionField(transactionId, field);
    }
    
    return null;
  }

  async hset(key, field, value) {
    await this.initialize();
    
    // Se field é um objeto, usar como dados completos
    let data;
    if (typeof field === 'object' && field !== null) {
      data = field;
    } else {
      // Se field é string, criar objeto com field: value
      data = { [field]: value };
    }
    
    if (key.startsWith('user:')) {
      const userId = key.split(':')[1];
      return await this.setUser(userId, data);
    }
    
    if (key.startsWith('transaction:')) {
      const transactionId = key.split(':')[1];
      return await this.setTransaction(transactionId, data);
    }
  }

  async hincrby(key, field, increment) {
    await this.initialize();
    
    if (key.startsWith('user:')) {
      const userId = key.split(':')[1];
      return await this.incrementUserField(userId, field, increment);
    }
  }

  async hgetall(key) {
    await this.initialize();
    
    if (key.startsWith('user:')) {
      const userId = key.split(':')[1];
      return await this.getUser(userId);
    }
    
    if (key.startsWith('transaction:')) {
      const transactionId = key.split(':')[1];
      return await this.getTransaction(transactionId);
    }
    
    return null;
  }

  async lpush(key, value) {
    // Para compatibilidade, mas não implementado no Sheets
    // As transações serão rastreadas diretamente na aba de transações
    return true;
  }

  async lrange(key, start, stop) {
    // Para compatibilidade, mas não implementado no Sheets
    // Retorna array vazio
    return [];
  }

  // Métodos específicos do Google Sheets
  async getUser(userId) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'usuarios!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const userRow = rows.find(row => row[0] === userId);
      
      if (!userRow) return null;
      
      const userData = {};
      headers.forEach((header, index) => {
        userData[header] = userRow[index] || '';
      });
      
      return userData;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async getTransaction(transactionId) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'transacoes!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const transactionRow = rows.find(row => row[0] === transactionId);
      
      if (!transactionRow) return null;
      
      const transactionData = {};
      headers.forEach((header, index) => {
        transactionData[header] = transactionRow[index] || '';
      });
      
      return transactionData;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return null;
    }
  }

  async getUserField(userId, field) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'usuarios!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const userRow = rows.find(row => row[0] === userId);
      
      if (!userRow) {
        return null;
      }
      
      const fieldIndex = headers.indexOf(field);
      let value = fieldIndex >= 0 ? userRow[fieldIndex] : null;
      
      // Se o campo for 'balance' e o valor for string vazia, retornar null
      if (field === 'balance' && value === '') {
        value = null;
      }
      
      return value;
    } catch (error) {
      console.error('Erro ao buscar campo do usuário:', error);
      return null;
    }
  }

  async setUser(userId, data) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'usuarios!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || ['userId', 'balance', 'created_at', 'updated_at'];
      const userRowIndex = rows.findIndex(row => row[0] === userId);
      
      const now = new Date().toISOString();
      const userData = {
        userId,
        balance: data.balance !== undefined ? data.balance : 0,
        created_at: data.created_at || now,
        updated_at: now,
        ...data
      };

      const rowData = headers.map(header => userData[header] || '');
      
      if (userRowIndex >= 0) {
        // Atualizar usuário existente
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `usuarios!A${userRowIndex + 1}`,
          valueInputOption: 'RAW',
          resource: {
            values: [rowData]
          }
        });
      } else {
        // Criar novo usuário
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'usuarios!A:Z',
          valueInputOption: 'RAW',
          resource: {
            values: [rowData]
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao definir usuário:', error);
      return false;
    }
  }

  async incrementUserField(userId, field, increment) {
    try {
      const currentValue = parseFloat(await this.getUserField(userId, field) || 0);
      const newValue = currentValue + parseFloat(increment);
      
      await this.setUser(userId, { [field]: newValue });
      return newValue;
    } catch (error) {
      console.error('Erro ao incrementar campo do usuário:', error);
      return null;
    }
  }

  async setTransaction(transactionId, data) {
    try {
      const headers = ['transactionId', 'userId', 'type', 'amount', 'paymentId', 'timestamp', 'status'];
      const transactionData = {
        transactionId,
        ...data
      };

      const rowData = headers.map(header => transactionData[header] || '');
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'transacoes!A:Z',
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao definir transação:', error);
      return false;
    }
  }

  async getTransactionField(transactionId, field) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'transacoes!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const transactionRow = rows.find(row => row[0] === transactionId);
      
      if (!transactionRow) return null;
      
      const fieldIndex = headers.indexOf(field);
      return fieldIndex >= 0 ? transactionRow[fieldIndex] : null;
    } catch (error) {
      console.error('Erro ao buscar campo da transação:', error);
      return null;
    }
  }

  // Método específico para saques pendentes
  async addWithdrawalRequest(transactionId, data) {
    try {
      const headers = ['transactionId', 'userId', 'pixKey', 'amount', 'netAmount', 'fee', 'timestamp', 'status', 'admin_approval', 'admin_notes', 'processed_at'];
      const withdrawalData = {
        transactionId,
        status: 'pending',
        admin_approval: 'PENDENTE',
        admin_notes: '',
        processed_at: '',
        ...data
      };

      const rowData = headers.map(header => withdrawalData[header] || '');
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'saques_pendentes!A:Z',
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar solicitação de saque:', error);
      return false;
    }
  }

  // Método para verificar aprovações de saque
  async checkWithdrawalApprovals() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'saques_pendentes!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const approvalIndex = headers.indexOf('admin_approval');
      const statusIndex = headers.indexOf('status');
      
      if (approvalIndex < 0 || statusIndex < 0) return [];

      const approvedWithdrawals = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const approval = row[approvalIndex];
        const status = row[statusIndex];
        
        if ((approval === 'APROVADO' || approval === 'APROVADA') && status === 'pending') {
          const withdrawal = {};
          headers.forEach((header, index) => {
            withdrawal[header] = row[index] || '';
          });
          withdrawal.rowIndex = i + 1; // Para atualizar depois
          approvedWithdrawals.push(withdrawal);
        }
      }
      
      return approvedWithdrawals;
    } catch (error) {
      console.error('Erro ao verificar aprovações de saque:', error);
      return [];
    }
  }

  // Método para marcar saque como processado
  async markWithdrawalAsProcessed(transactionId, success = true) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'saques_pendentes!A:Z'
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const transactionIndex = headers.indexOf('transactionId');
      const statusIndex = headers.indexOf('status');
      const processedIndex = headers.indexOf('processed_at');
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[transactionIndex] === transactionId) {
          row[statusIndex] = success ? 'completed' : 'failed';
          row[processedIndex] = new Date().toISOString();
          
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `saques_pendentes!A${i + 1}`,
            valueInputOption: 'RAW',
            resource: {
              values: [row]
            }
          });
          break;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar saque como processado:', error);
      return false;
    }
  }
}

export const googleSheetsDB = new GoogleSheetsDB();
export default googleSheetsDB;