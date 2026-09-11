import React, { useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Icon, Wordmark } from './kit';
import { IMAGES } from '@/data/seed';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup' | 'forgot';

const AuthScreen: React.FC = () => {
  const { signInEmail, signUpEmail, signInDemo, signInOAuth, resetPassword, loading, authError } = useAloha();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState(true);
  const [err, setErr] = useState('');

  const subscribe = async (source: string, tag: string) => {
    try {
      await fetch('https://famous.ai/api/crm/6aa44ca2f927cfcd64fddb19/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          phone: phone.trim() ? phone.trim() : undefined,
          sms_opt_in: sms === true,
          source,
          tags: ['aloha-hunt', tag],
        }),
      });
    } catch { /* demo continues offline */ }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    if (mode === 'forgot') {
      void subscribe('password-reset', 'returning-member');
      await resetPassword(email);
      setMode('signin');
      return;
    }
    if (password.length < 8) return setErr('Use at least 8 characters for your password.');
    if (mode === 'signup') {
      if (name.trim().length < 2) return setErr('Tell us your first name.');
      void subscribe('app-signup', 'new-member');
      await signUpEmail(email.trim(), password, name.trim());
      return;
    }
    void subscribe('app-signin', 'returning-member');
    await signInEmail(email.trim(), password);
  };

  const message = err || authError;

  return (
    <div className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#031A27]">
      <div className="relative h-[34%] min-h-[200px] w-full overflow-hidden">
        <img src={IMAGES.heroes[1]} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#031A27]/45 via-[#031A27]/50 to-[#FBF7F0]" />
        <div className="absolute inset-x-0 top-10 flex justify-center"><Wordmark light tagline /></div>
      </div>

      <div className="relative -mt-8 rounded-t-[28px] bg-[#FBF7F0] px-6 pb-10 pt-7">
        <div className="mb-5 flex gap-1 rounded-2xl bg-[#0B4F6C]/8 p-1">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(''); }}
              className={cn('flex-1 rounded-xl py-2.5 text-[13px] font-bold transition',
                mode === m ? 'bg-white text-[#062B3F] shadow-sm' : 'text-[#0B4F6C]/60')}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && <Field icon="User" label="First name" value={name} onChange={setName} placeholder="Kai" />}
          <Field icon="Mail" label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
          {mode !== 'forgot' && (
            <Field icon="Lock" label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" type="password" />
          )}
          <Field icon="Phone" label="Phone number (optional)" value={phone} onChange={setPhone} placeholder="(808) 555-0134" type="tel" />
          <label className="flex items-start gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/5">
            <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1FA9A3]" />
            <span className="text-[11.5px] leading-relaxed text-[#0B4F6C]/70">
              Text me Aloha Drop alerts and Hunt updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.
            </span>
          </label>

          {message && (
            <div className="flex items-start gap-2 rounded-2xl bg-[#FF6F59]/10 p-3 text-[12.5px] font-semibold text-[#B23D2A] ring-1 ring-[#FF6F59]/25">
              <Icon name="AlertCircle" className="mt-0.5 h-4 w-4 shrink-0" />{message}
            </div>
          )}

          <Btn full size="lg" variant="primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
          </Btn>
        </form>

        {mode !== 'forgot' && (
          <>
            <button onClick={() => setMode('forgot')} className="mt-3 w-full text-center text-[12.5px] font-bold text-[#1FA9A3] hover:underline">
              Forgot password?
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#0B4F6C]/12" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B4F6C]/40">or</span>
              <div className="h-px flex-1 bg-[#0B4F6C]/12" />
            </div>

            <div className="space-y-2.5">
              <button type="button" onClick={() => signInOAuth('apple')} className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#062B3F] py-3.5 text-[14px] font-bold text-white transition active:scale-[.98]">
                <Icon name="Apple" className="h-[18px] w-[18px]" /> Continue with Apple
              </button>
              <button type="button" onClick={() => signInOAuth('google')} className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-black/8 bg-white py-3.5 text-[14px] font-bold text-[#062B3F] transition active:scale-[.98]">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9Z" /><path fill="#34A853" d="M12 23c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1a6.1 6.1 0 0 1-5.8-4.2H2.7v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M6.2 14.7a6.5 6.5 0 0 1 0-4.1V7.8H2.7a11 11 0 0 0 0 9.7l3.5-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3-3A11 11 0 0 0 2.7 7.8l3.5 2.8A6.1 6.1 0 0 1 12 5.4Z" /></svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[#1FA9A3]/25 bg-[#1FA9A3]/8 p-4">
              <div className="flex items-center gap-2.5">
                <img src={IMAGES.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold text-[#062B3F]">Demo account</p>
                  <p className="truncate text-[11.5px] text-[#0B4F6C]/65">Kai · Oʻahu Explorer · real account, real ledger</p>
                </div>
              </div>
              <Btn full size="sm" variant="secondary" className="mt-3" icon="Play" type="button" disabled={loading} onClick={() => signInDemo()}>
                {loading ? 'Signing in…' : 'Enter demo account'}
              </Btn>
              <p className="mt-2 text-[10.5px] leading-relaxed text-[#0B4F6C]/50">
                Creates/signs into a persistent account and seeds the starting Oʻahu history server-side.
              </p>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <button onClick={() => setMode('signin')} className="mt-4 w-full text-center text-[12.5px] font-bold text-[#1FA9A3]">Back to sign in</button>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#0B4F6C]/45">
          By continuing you agree to the Aloha Hunt <span className="font-bold underline">Terms of Service</span> and{' '}
          <span className="font-bold underline">Privacy Policy</span>. Aloha Points are loyalty points with no cash value.
        </p>
      </div>
    </div>
  );
};

const Field: React.FC<{ icon: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ icon, label, value, onChange, placeholder, type = 'text' }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-[#0B4F6C]/55">{label}</span>
    <span className="relative flex items-center">
      <Icon name={icon} className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-[#0B4F6C]/35" />
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/8 bg-white py-3.5 pl-11 pr-4 text-[14.5px] font-semibold text-[#062B3F] outline-none transition placeholder:font-normal placeholder:text-[#0B4F6C]/30 focus:border-[#1FA9A3] focus:ring-4 focus:ring-[#1FA9A3]/12"
      />
    </span>
  </label>
);

export default AuthScreen;
