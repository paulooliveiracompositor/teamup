
import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return;

    // Android / Desktop Chrome Handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOS && !isInStandaloneMode) {
      // Show prompt after a delay to not annoy immediately
      const timer = setTimeout(() => setShowIOSPrompt(true), 8000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Android/Desktop Install Button */}
      {deferredPrompt && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in-up">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl font-semibold hover:scale-105 transition active:scale-95 border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Instalar App</span>
          </button>
        </div>
      )}

      {/* iOS Instructions Toast */}
      {showIOSPrompt && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-fade-in-up">
           <div className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 relative max-w-sm mx-auto">
             <button onClick={() => setShowIOSPrompt(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div className="flex gap-4">
               <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📱</div>
               <div>
                 <h4 className="font-bold text-gray-900 dark:text-white text-sm">Instalar Team-Up</h4>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Para instalar no iPhone/iPad:</p>
                 <ol className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1 list-decimal list-inside">
                   <li>Toque no botão <strong>Compartilhar</strong> <span className="inline-block align-middle"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span></li>
                   <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <span className="inline-block align-middle">➕</span></li>
                 </ol>
               </div>
             </div>
           </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
