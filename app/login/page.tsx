'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'citizen' | 'ward_officer'>('citizen');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [wardId, setWardId] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (!isLogin) {
      if (!name) {
        toast.error('Please enter your full name');
        return;
      }
      if (role === 'ward_officer' && !wardId) {
        toast.error('Please enter your Ward ID');
        return;
      }
    }

    setIsLoading(true);
    try {
      let user;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found in database.');
        } else {
          toast.success('Signed in successfully');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: name,
          role: role,
          homeWardId: role === 'ward_officer' ? wardId : 'UNASSIGNED',
          preferredLanguage: 'en',
          points: 0,
          rank: 'SEEDLING',
          badges: [],
          streakDays: 0,
          lastActivity: new Date().toISOString(),
          reportsCount: 0,
          verificationsGiven: 0,
          issuesResolvedCount: 0,
          reputationScore: 100,
          fraudFlags: 0,
          isVerifiedReporter: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date().toISOString()
        });

        toast.success('Account created successfully');
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || (role === 'ward_officer' ? 'Ward Officer' : 'Citizen'),
          role: role,
          homeWardId: 'UNASSIGNED',
          preferredLanguage: 'en',
          points: 0,
          rank: 'SEEDLING',
          badges: [],
          streakDays: 0,
          lastActivity: new Date().toISOString(),
          reportsCount: 0,
          verificationsGiven: 0,
          issuesResolvedCount: 0,
          reputationScore: 100,
          fraudFlags: 0,
          isVerifiedReporter: true,
          accountStatus: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
        toast.success('Account created with Google successfully');
      } else {
        toast.success('Signed in with Google successfully');
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-12 xl:px-24">
        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-[380px] w-full mx-auto">
          <div className="flex bg-muted/50 p-1 rounded-full mb-8">
            <button 
              type="button"
              onClick={() => setRole('citizen')}
              className={`flex-1 text-sm font-medium py-2 rounded-full transition-colors ${role === 'citizen' ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Citizen
            </button>
            <button 
              type="button"
              onClick={() => setRole('ward_officer')}
              className={`flex-1 text-sm font-medium py-2 rounded-full transition-colors ${role === 'ward_officer' ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ward Officer
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              {isLogin ? 'Log in' : 'Create account'}
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {isLogin ? (
                <>
                  <span>or</span>
                  <button onClick={() => setIsLogin(false)} className="text-civic-warning hover:underline font-medium decoration-civic-warning underline-offset-4">create an account</button>
                  <span>if you don&apos;t have one yet</span>
                </>
              ) : (
                <>
                  <span>or</span>
                  <button onClick={() => setIsLogin(true)} className="text-civic-warning hover:underline font-medium decoration-civic-warning underline-offset-4">log in</button>
                  <span>if you already have one</span>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-foreground font-semibold">Full Name</Label>
                  <Input 
                    id="name" 
                    className="bg-muted/30 border-none h-12"
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {role === 'ward_officer' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ward" className="text-foreground font-semibold">Ward ID</Label>
                    <Input 
                      id="ward"
                      className="bg-muted/30 border-none h-12" 
                      placeholder="WARD-01" 
                      value={wardId}
                      onChange={(e) => setWardId(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground font-semibold">Username or email</Label>
              <Input 
                id="email" 
                type="email"
                className="bg-muted/30 border-none h-12"
                placeholder="officer@civicpulse.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="text-right">
                <button type="button" className="text-xs font-medium text-civic-warning hover:underline underline-offset-4">I can&apos;t remember</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  className="bg-muted/30 border-none h-12 pr-10"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-civic-warning/80 hover:text-civic-warning"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-muted-foreground/30 data-[state=checked]:bg-civic-warning data-[state=checked]:border-civic-warning" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <button type="button" className="text-xs font-medium text-civic-warning hover:underline underline-offset-4">
                I forgot the password
              </button>
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#f48c42] hover:bg-[#d97c3a] text-white font-semibold h-12 rounded-full mt-4" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLogin ? 'Log me in' : 'Create account'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-4 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              type="button" 
              onClick={handleGoogleAuth}
              variant="outline" 
              className="w-full h-11 rounded-full font-medium border-muted/60 text-foreground hover:bg-muted/20"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Log in with Google
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 rounded-full font-medium border-muted/60 text-foreground hover:bg-muted/20"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Log in with Apple
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side: CTA & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f0eee4] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Header/Logo moved to Right Side */}
        <div className="absolute top-8 left-12 flex items-center gap-2 z-20">
           <Building2 className="w-6 h-6 text-civic-primary" fill="currentColor" fillOpacity={0.2} />
           <span className="font-bold text-xl tracking-tight text-[#295073]">CivicPulse AI</span>
        </div>

        {/* Decorative background shapes mimicking the image */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#295073] rounded-full blur-[80px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-civic-warning rounded-full blur-[60px] opacity-10" />
        
        {/* Main CTA Block */}
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-surface rounded-full shadow-xl mb-4">
             <Building2 className="w-12 h-12 text-civic-primary" />
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#295073] leading-tight">
            Report. Resolve. <span className="text-civic-warning relative">
              Reimagine.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                 <path d="M0,10 Q50,20 100,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          
          <p className="text-lg text-[#295073]/80 font-medium leading-relaxed">
            Empowering ward officers to manage urban infrastructure efficiently. 
            Join the network of civic heroes building better, safer, and smarter cities.
          </p>

          <div className="pt-8 flex justify-center gap-4">
             <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#295073]">12k+</span>
                <span className="text-sm font-medium text-[#295073]/60 uppercase tracking-wider">Issues Resolved</span>
             </div>
             <div className="w-px h-12 bg-[#295073]/20" />
             <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#295073]">98%</span>
                <span className="text-sm font-medium text-[#295073]/60 uppercase tracking-wider">SLA Compliance</span>
             </div>
          </div>
        </div>

        {/* Floating elements to add depth */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-civic-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-32 left-20 w-24 h-24 bg-civic-critical/20 rounded-full blur-xl" />
      </div>
    </div>
  );
}

