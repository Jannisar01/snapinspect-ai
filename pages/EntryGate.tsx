
import React, { useState, useEffect } from 'react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { authService, User } from '../services/authService';
import { 
  ShieldCheck, Lock, KeyRound, AlertCircle, Mail, 
  User as UserIcon, LogIn, Fingerprint,
  Globe, Smartphone, Monitor, BellRing, RefreshCw
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'MFA';

const EntryGate: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showToast, setShowToast] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const triggerSimulationToast = (code: string) => {
    setSimulatedCode(code);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 8000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.requiresMfa && result.user && result.code) {
        setPendingUser(result.user);
        setMode('MFA');
        triggerSimulationToast(result.code);
      } else if (result.user) {
        login(result.user);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials provided.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.signup(name, email, password);
      setPendingUser(result.user);
      setMode('MFA');
      triggerSimulationToast(result.code);
    } catch (err: any) {
      setError("Failed to create account. Security conflict.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const success = await authService.verifyMfa(mfaCode);
    if (success && pendingUser) {
      login({ ...pendingUser, isMfaVerified: true });
    } else {
      setError("Incorrect code. Authentication failed.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    const code = await authService.resendCode();
    triggerSimulationToast(code);
    setIsLoading(false);
  };

  const handleSocial = async (provider: 'google' | 'apple' | 'microsoft') => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.socialLogin(provider);
      login(user);
    } catch (err) {
      setError("Social authentication service currently unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#1F2937] flex flex-col items-center justify-center p-6 text-white font-sans overflow-y-auto">
      
      {showToast && (
        <div className="fixed top-6 right-6 z-[400] w-80 bg-white border border-[#E5E7EB] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden rounded-xl">
          <div className="bg-[#2563EB] px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center">
              <BellRing className="w-3 h-3 mr-2" /> Security Node
            </span>
            <button onClick={() => setShowToast(false)} className="text-white font-bold text-xs">×</button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-[10px] text-[#4B5563] font-bold uppercase">System Message:</p>
            <p className="text-xs text-[#1F2937] leading-tight font-medium">Your verification token for <span className="text-[#2563EB] font-bold">SnapInspect</span> is ready.</p>
            <div className="bg-[#EEF2F6] p-3 text-center rounded-lg border border-[#E5E7EB]">
               <span className="text-xl font-mono font-bold text-[#2563EB] tracking-[0.3em]">{simulatedCode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Background Decor - Switched to Primary Blue range */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #2563EB 0%, transparent 70%)' }}></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="relative w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-2">
          <div className="p-4 bg-[#2563EB] rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.3)]">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-oswald font-bold tracking-tight uppercase italic text-white">
            Snap<span className="text-white/60">Inspect</span>.AI
          </h1>
          <p className="text-[#9CA3AF] font-bold text-[9px] tracking-[0.4em] uppercase">
            Global Enterprise Security Hub
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300 border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2563EB]"></div>

          {mode === 'MFA' ? (
            <form onSubmit={handleMfa} className="space-y-6 animate-in slide-in-from-right duration-300">
               <div className="text-center space-y-2 pt-2">
                 <Fingerprint className="w-12 h-12 text-[#2563EB] mx-auto animate-pulse" />
                 <h2 className="text-xl font-oswald font-bold uppercase text-[#1F2937]">Verify Identity</h2>
                 <p className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold">MFA code transmitted to secure endpoint.</p>
               </div>
               
               <div className="relative">
                 <Input 
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-3xl tracking-[0.5em] font-mono border-[#E5E7EB] bg-[#F5F7FA] h-16 text-[#1F2937]"
                  autoFocus
                 />
                 {error && (
                  <div className="absolute -bottom-6 left-0 right-0 text-center">
                    <span className="text-[10px] text-[#DC2626] font-bold uppercase tracking-widest">{error}</span>
                  </div>
                 )}
               </div>

               <div className="pt-4 space-y-4">
                 <Button type="submit" isLoading={isLoading} disabled={mfaCode.length < 6} className="w-full py-4 text-sm tracking-widest uppercase">
                    Authenticate Session
                 </Button>
                 
                 <div className="flex items-center justify-between gap-4">
                    <button type="button" onClick={handleResend} className="text-[9px] text-[#4B5563] hover:text-[#2563EB] uppercase font-bold tracking-widest flex items-center gap-1 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Resend
                    </button>
                    <button type="button" onClick={() => { setMode('LOGIN'); setError(null); }} className="text-[9px] text-[#9CA3AF] hover:text-[#2563EB] uppercase font-bold tracking-widest">
                      [ Back to Login ]
                    </button>
                 </div>
               </div>
            </form>
          ) : (
            <>
              <div className="flex border-b border-[#E5E7EB] mb-8">
                <button 
                  onClick={() => { setMode('LOGIN'); setError(null); }}
                  className={`flex-1 pb-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${mode === 'LOGIN' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#9CA3AF]'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setMode('SIGNUP'); setError(null); }}
                  className={`flex-1 pb-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${mode === 'SIGNUP' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#9CA3AF]'}`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={mode === 'LOGIN' ? handleLogin : handleSignup} className="space-y-4">
                {mode === 'SIGNUP' && (
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors" />
                    <Input 
                      placeholder="FULL NAME"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-10 text-[11px] font-bold"
                      required
                    />
                  </div>
                )}
                
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors" />
                  <Input 
                    type="email"
                    placeholder="CORPORATE EMAIL"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 text-[11px] font-bold"
                    required
                  />
                </div>

                <div className="relative group">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors" />
                  <Input 
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 text-[11px] font-bold"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-[#DC2626] shrink-0" />
                    <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest">{error}</span>
                  </div>
                )}

                <Button type="submit" isLoading={isLoading} className="w-full py-4 text-sm uppercase tracking-widest font-bold">
                  {mode === 'LOGIN' ? 'Initiate Session' : 'Register Identity'} <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.3em]"><span className="bg-white px-4 text-[#9CA3AF]">Secure SSO Handshake</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => handleSocial('google')} className="flex items-center justify-center p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl hover:bg-[#EEF2F6] hover:border-[#2563EB] text-[#4B5563] transition-all">
                  <Globe className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => handleSocial('microsoft')} className="flex items-center justify-center p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl hover:bg-[#EEF2F6] hover:border-[#2563EB] text-[#4B5563] transition-all">
                  <Monitor className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => handleSocial('apple')} className="flex items-center justify-center p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl hover:bg-[#EEF2F6] hover:border-[#2563EB] text-[#4B5563] transition-all">
                  <Smartphone className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest max-w-xs mx-auto text-center">
          ISO 27001 COMPLIANT. SnapInspect AI requires valid tokens for data localized node access.
        </div>
      </div>
    </div>
  );
};

export default EntryGate;
