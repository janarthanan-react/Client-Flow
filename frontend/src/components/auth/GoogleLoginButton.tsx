import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ExternalLink, Check, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  mode?: 'signin' | 'signup';
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  mode = 'signin',
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [clientId, setClientId] = useState<string>(() => {
    return (
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
      localStorage.getItem('cf_google_client_id') ||
      ''
    );
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualClientId, setManualClientId] = useState(clientId);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) {
        toastError('Google Sign-In Error', 'No credential received from Google.');
        return;
      }

      try {
        setIsAuthenticating(true);
        const res = await loginWithGoogle(response.credential);
        const user = res?.data?.user;
        const name = user ? `${user.firstName} ${user.lastName}`.trim() : 'there';
        success('Welcome!', `Successfully signed in with Google as ${name}.`);
        navigate('/dashboard');
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          'Failed to authenticate with Google. Please try again.';
        toastError('Authentication Failed', message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [loginWithGoogle, navigate, success, toastError]
  );

  // Poll or detect when window.google is loaded
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsGsiLoaded(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        clearInterval(checkInterval);
      }
    }, 200);

    const timer = setTimeout(() => clearInterval(checkInterval), 10000);
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timer);
    };
  }, []);

  // Initialize and render Google button when clientId and window.google are available
  useEffect(() => {
    if (!clientId || !isGsiLoaded || !buttonRef.current) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any previous rendered button
      buttonRef.current.innerHTML = '';

      window.google!.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonRef.current.offsetWidth || 340,
      });
    } catch (err) {
      console.error('Error rendering Google Sign-In button:', err);
    }
  }, [clientId, isGsiLoaded, mode, handleCredentialResponse]);

  const handleSaveManualClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualClientId.trim();
    if (!trimmed) {
      localStorage.removeItem('cf_google_client_id');
      setClientId('');
      setIsModalOpen(false);
      return;
    }
    localStorage.setItem('cf_google_client_id', trimmed);
    setClientId(trimmed);
    setIsModalOpen(false);
    success('Google Client ID Saved', 'Real Google Sign-In is now active for this browser.');
  };

  const copyEnvSnippet = () => {
    const snippet = `VITE_GOOGLE_CLIENT_ID=${manualClientId || 'your_client_id.apps.googleusercontent.com'}\nGOOGLE_CLIENT_ID=${manualClientId || 'your_client_id.apps.googleusercontent.com'}`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className={`w-full ${className}`}>
      {isAuthenticating && (
        <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium shadow-xs animate-pulse mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Authenticating with Google...</span>
        </div>
      )}

      {clientId ? (
        <div className="w-full flex flex-col items-center">
          {/* Container for official Google GIS button */}
          <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>Configure Google OAuth</span>
          </button>
        </div>
      ) : (
        /* Fallback button when Client ID is not yet configured */
        <div className="w-full">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.39 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 group-hover:bg-indigo-100/70 transition-colors">
              Setup
            </span>
          </button>
        </div>
      )}

      {/* Setup Guide Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Google OAuth 2.0 Setup"
        description="Connect real Google Sign-In & Workspace Authentication"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              To enable real Google authentication, you need an OAuth 2.0 Client ID from Google Cloud Console.
            </p>
          </div>

          <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
            <li>
              Go to the{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
              >
                Google Cloud Console Credentials page
                <ExternalLink className="w-3 h-3" />
              </a>
              .
            </li>
            <li>
              Click <strong className="text-slate-800">Create Credentials</strong> &rarr;{' '}
              <strong className="text-slate-800">OAuth client ID</strong>.
            </li>
            <li>
              Select Application type: <strong className="text-slate-800">Web application</strong>.
            </li>
            <li>
              Under <strong className="text-slate-800">Authorized JavaScript origins</strong>, add:
              <div className="mt-1 font-mono text-[11px] bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-slate-800 select-all">
                http://localhost:5173
              </div>
            </li>
            <li>
              Copy the resulting <strong className="text-slate-800">Client ID</strong>.
            </li>
          </ol>

          <form onSubmit={handleSaveManualClientId} className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter your Google Client ID for this browser:
              </label>
              <input
                type="text"
                value={manualClientId}
                onChange={(e) => setManualClientId(e.target.value)}
                placeholder="e.g. 1234567890-abc123xyz.apps.googleusercontent.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={copyEnvSnippet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copied to Clipboard!' : 'Copy .env snippet'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
