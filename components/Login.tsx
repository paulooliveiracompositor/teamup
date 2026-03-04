import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../constants';

interface Props {
  onLogin: () => void;
  onCancel: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-white">Acesso Administrativo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Digite a senha (admin)"
            autoFocus
          />
        </div>
        {error && <div className="text-red-500 dark:text-red-400 text-sm text-center">Senha incorreta</div>}
        <div className="flex gap-2">
           <button type="button" onClick={onCancel} className="flex-1 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
           <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Entrar</button>
        </div>
      </form>
    </div>
  );
};

export default Login;