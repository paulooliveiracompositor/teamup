import React from 'react';

interface Props {
  onClose: () => void;
}

const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="p-6 text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary dark:text-blue-300 text-xl">
            💡
          </div>
          <div>
            <h2 className="text-xl font-bold">Como usar o Team-Up</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Guia rápido para professores</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">1</div>
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Escolha a Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Navegue pelo calendário e clique no dia desejado. Você pode ver as reservas existentes (barrinhas coloridas) para evitar conflitos.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">2</div>
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Faça a Reserva</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Clique no botão <span className="text-secondary font-bold">+ Nova Reserva</span> (ou no botão "+ Criar" ao passar o mouse no dia).
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">3</div>
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Preencha os Dados</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Informe seu nome, horários e selecione os equipamentos. Você pode marcar múltiplos equipamentos de uma só vez!
            </p>
          </div>
        </div>

        {/* Rules Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4 mt-4">
          <h4 className="font-bold text-yellow-800 dark:text-yellow-400 text-sm mb-2 flex items-center gap-2">
            ⚠️ Regras Importantes
          </h4>
          <ul className="text-xs text-yellow-800 dark:text-yellow-200/80 space-y-1 list-disc list-inside">
            <li>Não é permitido reservar o mesmo equipamento no mesmo horário que outro professor.</li>
            <li>A <strong>Sala de Vídeo</strong> só está disponível no período <strong>vespertino</strong> (após as 13:00).</li>
            <li>Para cancelar uma reserva, clique sobre ela no calendário.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={onClose}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition transform active:scale-95"
        >
          Entendi, vamos começar!
        </button>
      </div>
    </div>
  );
};

export default HelpModal;