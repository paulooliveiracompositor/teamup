import React, { useState } from 'react';
import { payloadService } from '../services/payloadService';

interface Props {
  onLogin: (user: any) => void;
  onCancel?: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await payloadService.login(email, password);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || 'Login falhou. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center border-b dark:border-gray-700 pb-4 mb-6 text-gray-800 dark:text-white">
        Acesso do Professor
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Cadastrado</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="professor@escola.com"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Sua senha de acesso"
            required
          />
        </div>

        {error && <div className="text-red-500 dark:text-red-400 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</div>}

        <div className="flex gap-3 pt-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex-1 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;