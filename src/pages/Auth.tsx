import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Loader2, ArrowLeft, Shield, Zap, Eye, EyeOff, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { PageMeta } from '@/components/seo/PageMeta';

const GOLD = '#c9a84c';
const GOLD_SOFT = '#f0d78c';
const INK = '#0a0a0a';
const COAL = '#141414';
const PARCHMENT = '#efe7d4';
const BORDER = 'rgba(201,168,76,.22)';
const GOLD_GRAD = 'linear-gradient(135deg, #f0d78c 0%, #c9a84c 55%, #8b6f24 100%)';




const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) navigate('/engagement-order');
  }, [user, isLoading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage(''); setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !z.string().email().safeParse(trimmedEmail).success) {
        setError('Please enter a valid email address'); setIsSubmitting(false); return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo: `${window.location.origin}/auth` });
      if (error) setError(error.message); else setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch { setError('Something went wrong.'); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage(''); setIsSubmitting(true);
    try {
      if (isLogin) {
        const v = loginSchema.safeParse({ email, password });
        if (!v.success) { setError(v.error.errors[0].message); setIsSubmitting(false); return; }
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid login credentials')) setError('Incorrect email or password.');
          else if (msg.includes('email not confirmed')) setError('Please verify your email first.');
          else if (msg.includes('rate limit')) setError('Too many attempts. Try again in 5 mins.');
          else setError('Login failed.');
          setIsSubmitting(false); return;
        }
        navigate('/engagement-order', { replace: true });
      } else {
        const v = signupSchema.safeParse({ email, password, fullName });
        if (!v.success) { setError(v.error.errors[0].message); setIsSubmitting(false); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('already registered')) setError('This email is already registered.');
          else if (msg.includes('rate limit')) setError('Too many attempts. Wait 5 minutes.');
          else setError(error.message || 'Signup failed.');
          setIsSubmitting(false); return;
        }
        setSuccessMessage('Account created successfully!');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err: any) {
      if (!err?.message?.includes('abort')) setError('Something went wrong. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const inputClass = "h-12 rounded-xl bg-[#141414] focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/25 font-medium px-4 placeholder:text-[#6b6453] transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: INK, color: PARCHMENT }}>
      {/* gold orbs */}
      <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.18), transparent 70%)', filter: 'blur(40px)' }} />
      <div aria-hidden className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(240,215,140,.12), transparent 70%)', filter: 'blur(40px)' }} />
      {/* gold filigree */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,.5), transparent)' }} />

      <PageMeta
        title={isLogin ? 'Sign in — MultySMM' : 'Create your account — MultySMM'}
        description="Sign in or create your free MultySMM account to launch AI-powered Instagram, YouTube and TikTok growth campaigns. No credit card required."
        canonicalPath="/auth"
      />
      <div className="w-full max-w-[420px] relative">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[18px]"
              style={{ background: GOLD_GRAD, color: INK, boxShadow: '0 12px 28px -8px rgba(201,168,76,.55)' }}>M</div>
            <div className="flex flex-col leading-tight">
              <span className="text-[22px] tracking-tight" style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif" }}>
                Multy<em style={{ color: GOLD_SOFT }}>SMM</em>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                ✦ Noir Edition
              </span>
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-8 transition-colors hover:text-[#f0d78c]"
            style={{ color: 'rgba(239,231,212,.55)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>

          <h1 className="text-[44px] leading-[1.05] mb-2 tracking-tight" style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>
            {isForgotPassword ? <>Reset your <em style={{ color: GOLD_SOFT }}>password</em></> : isLogin ? <>Welcome <em style={{ color: GOLD_SOFT }}>back</em></> : <>Create an <em style={{ color: GOLD_SOFT }}>account</em></>}
          </h1>
          <p className="text-[14px] mb-8" style={{ color: 'rgba(239,231,212,.55)' }}>
            {isForgotPassword ? 'Enter your email to receive a reset link.' : isLogin ? 'Sign in to your MultySMM account.' : 'Get started for free — no credit card.'}
          </p>



          {showVerifyEmail ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: COAL, border: `1px solid ${BORDER}` }}>
                <Mail className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <h3 className="text-2xl mb-2" style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif" }}>Check your inbox</h3>
              <p className="text-[13px] mb-2" style={{ color: 'rgba(239,231,212,.55)' }}>Verification link sent to:</p>
              <p className="text-[13px] font-semibold mb-6" style={{ color: PARCHMENT }}>{email}</p>
              <button onClick={() => { setShowVerifyEmail(false); setIsLogin(true); }} className="text-[13px] font-bold" style={{ color: GOLD_SOFT }}>
                ← Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
              {isForgotPassword ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[11px] font-bold mb-1.5 block uppercase tracking-[0.14em]" style={{ color: 'rgba(239,231,212,.6)' }}>Email</Label>
                    <Input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} style={{ border: `1px solid ${BORDER}`, color: PARCHMENT }} />
                  </div>
                  {error && <p className="text-[13px] font-medium" style={{ color: '#ef6f6f' }}>{error}</p>}
                  {successMessage && <p className="text-[13px] font-medium" style={{ color: GOLD_SOFT }}>{successMessage}</p>}
                  <button type="submit" disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-transform hover:-translate-y-0.5"
                    style={{ background: GOLD_GRAD, color: INK, boxShadow: '0 14px 30px -10px rgba(201,168,76,.55)' }}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send reset link <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-center text-[13px] font-medium" style={{ color: 'rgba(239,231,212,.55)' }}>
                    Back to login
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isLogin && (
                    <div>
                      <Label className="text-[11px] font-bold mb-1.5 block uppercase tracking-[0.14em]" style={{ color: 'rgba(239,231,212,.6)' }}>Full name</Label>
                      <Input placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} style={{ border: `1px solid ${BORDER}`, color: PARCHMENT }} />
                    </div>
                  )}
                  <div>
                    <Label className="text-[11px] font-bold mb-1.5 block uppercase tracking-[0.14em]" style={{ color: 'rgba(239,231,212,.6)' }}>Email</Label>
                    <Input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} style={{ border: `1px solid ${BORDER}`, color: PARCHMENT }} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(239,231,212,.6)' }}>Password</Label>
                      {isLogin && (
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[11px] font-semibold" style={{ color: GOLD_SOFT }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} pr-11`} style={{ border: `1px solid ${BORDER}`, color: PARCHMENT }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(239,231,212,.5)' }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-[13px] font-medium" style={{ color: '#ef6f6f' }}>{error}</p>}
                  {successMessage && <p className="text-[13px] font-medium" style={{ color: GOLD_SOFT }}>{successMessage}</p>}

                  <button type="submit" disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-transform hover:-translate-y-0.5"
                    style={{ background: GOLD_GRAD, color: INK, boxShadow: '0 14px 30px -10px rgba(201,168,76,.55)' }}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>

                  <p className="text-center text-[13px]" style={{ color: 'rgba(239,231,212,.55)' }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }} className="font-bold" style={{ color: GOLD_SOFT }}>
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              )}
            </form>
          )}

          {/* Telegram */}
          <a href="https://t.me/HenryMiller08" target="_blank" rel="noopener noreferrer"
            className="mt-8 flex items-center gap-3 p-3.5 rounded-xl transition-colors hover:bg-[#1a1a1a]"
            style={{ border: `1px solid ${BORDER}`, background: COAL }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,.10)', border: `1px solid ${BORDER}` }}>
              <Send className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: PARCHMENT }}>Join our Telegram</p>
              <p className="text-[11px]" style={{ color: 'rgba(239,231,212,.55)' }}>Updates & support</p>
            </div>
          </a>


      </div>
    </div>
  );
}
