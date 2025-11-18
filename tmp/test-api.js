const { api } = require('../frontend/src/tela-auth/src/services/api');

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

global.fetch = async (url, options = {}) => {
  console.log('URL:', url);
  console.log('BODY:', options.body);
  return {
    ok: true,
    status: 200,
    json: async () => ({ id: 1, conteudo: 'ok', dataHora: new Date().toISOString() }),
    text: async () => '',
  };
};

(async () => {
  const identifier = { cpf: '12345678900' };
  const payload = {
    conteudo: 'Teste mensagem',
    remetente: 'Cuidador',
    destinatario: 'Idoso',
  };
  await api.enviarMensagem(identifier, payload);
})();
