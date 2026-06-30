'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Trophy, 
  Award, 
  Flame, 
  Target, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  Language, 
  MapPin, 
  User as UserIcon, 
  Lock, 
  ChevronRight,
  RefreshCw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

// Definitions for all available badges in the system
interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  iconType: 'trophy' | 'award' | 'flame' | 'target' | 'activity' | 'shield' | 'sparkles';
  colorClass: string;
  borderColorClass: string;
  bgIconClass: string;
  checkUnlocked: (stats: UserStats) => boolean;
  getProgress: (stats: UserStats) => { current: number; total: number; percent: number };
}

interface UserStats {
  points: number;
  reportsCount: number;
  verificationsGiven: number;
  issuesResolvedCount: number;
  streakDays: number;
  reputationScore: number;
}

const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'seedling_citizen',
    title: 'Seedling Citizen',
    description: 'Welcome to the civic network! Started your journey to improve our community.',
    requirementText: 'Register an account',
    iconType: 'sparkles',
    colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    borderColorClass: 'border-emerald-200 dark:border-emerald-900',
    bgIconClass: 'bg-emerald-500',
    checkUnlocked: () => true,
    getProgress: () => ({ current: 1, total: 1, percent: 100 }),
  },
  {
    id: 'first_responder',
    title: 'First Responder',
    description: 'Spotted and reported your very first community infrastructure issue.',
    requirementText: 'Report 1 issue',
    iconType: 'activity',
    colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    borderColorClass: 'border-amber-200 dark:border-amber-900',
    bgIconClass: 'bg-amber-500',
    checkUnlocked: (stats) => stats.reportsCount >= 1,
    getProgress: (stats) => ({
      current: Math.min(stats.reportsCount, 1),
      total: 1,
      percent: Math.min((stats.reportsCount / 1) * 100, 100),
    }),
  },
  {
    id: 'pothole_patrol',
    title: 'Pothole Patrol',
    description: 'Actively monitoring ward safety by identifying 5 or more infrastructure reports.',
    requirementText: 'Report 5 issues',
    iconType: 'target',
    colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
    borderColorClass: 'border-blue-200 dark:border-blue-900',
    bgIconClass: 'bg-blue-500',
    checkUnlocked: (stats) => stats.reportsCount >= 5,
    getProgress: (stats) => ({
      current: Math.min(stats.reportsCount, 5),
      total: 5,
      percent: Math.min((stats.reportsCount / 5) * 100, 100),
    }),
  },
  {
    id: 'community_validator',
    title: 'Community Validator',
    description: 'Helping verify issues submitted by other citizens to ensure authenticity.',
    requirementText: 'Give 5 verifications',
    iconType: 'shield',
    colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    borderColorClass: 'border-indigo-200 dark:border-indigo-900',
    bgIconClass: 'bg-indigo-500',
    checkUnlocked: (stats) => stats.verificationsGiven >= 5,
    getProgress: (stats) => ({
      current: Math.min(stats.verificationsGiven, 5),
      total: 5,
      percent: Math.min((stats.verificationsGiven / 5) * 100, 100),
    }),
  },
  {
    id: 'sla_champion',
    title: 'SLA Champion',
    description: 'Collaborated successfully on reports that were resolved quickly.',
    requirementText: 'Have 5 resolved issues',
    iconType: 'award',
    colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
    borderColorClass: 'border-purple-200 dark:border-purple-900',
    bgIconClass: 'bg-purple-500',
    checkUnlocked: (stats) => stats.issuesResolvedCount >= 5,
    getProgress: (stats) => ({
      current: Math.min(stats.issuesResolvedCount, 5),
      total: 5,
      percent: Math.min((stats.issuesResolvedCount / 5) * 100, 100),
    }),
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Demonstrated dedication to Jayanagar with active logging 7 days in a row.',
    requirementText: 'Maintain a 7-day streak',
    iconType: 'flame',
    colorClass: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
    borderColorClass: 'border-orange-200 dark:border-orange-900',
    bgIconClass: 'bg-orange-500',
    checkUnlocked: (stats) => stats.streakDays >= 7,
    getProgress: (stats) => ({
      current: Math.min(stats.streakDays, 7),
      total: 7,
      percent: Math.min((stats.streakDays / 7) * 100, 100),
    }),
  },
];

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('citizen');
  const [homeWardId, setHomeWardId] = useState('WARD-47');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [userBadges, setUserBadges] = useState<string[]>([]);

  // User Stats
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    reportsCount: 0,
    verificationsGiven: 0,
    issuesResolvedCount: 0,
    streakDays: 0,
    reputationScore: 100,
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'badges' | 'simulator'>('profile');

  const checkAndAutoAward = async (uid: string, currentStats: UserStats, existingBadges: string[]) => {
    const newlyUnlocked: string[] = [];
    const updatedBadges = [...existingBadges];

    ALL_BADGES.forEach((badge) => {
      if (badge.checkUnlocked(currentStats) && !updatedBadges.includes(badge.id)) {
        updatedBadges.push(badge.id);
        newlyUnlocked.push(badge.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { badges: updatedBadges });
        setUserBadges(updatedBadges);
        
        // Toast notifications for newly unlocked badges
        newlyUnlocked.forEach((badgeId) => {
          const badge = ALL_BADGES.find(b => b.id === badgeId);
          if (badge) {
            toast.success(`✨ Badge Unlocked: ${badge.title}!`, {
              description: badge.description,
              duration: 5000,
            });
          }
        });
      } catch (err) {
        console.error('Error auto-awarding badges:', err);
      }
    }
  };

  const fetchUserProfile = async (uid: string) => {
    setProfileLoading(true);
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDisplayName(data.displayName || auth.currentUser?.displayName || 'Citizen Hero');
        setRole(data.role || 'citizen');
        setHomeWardId(data.homeWardId || 'WARD-47');
        setPreferredLanguage(data.preferredLanguage || 'en');
        setUserBadges(data.badges || []);
        
        const currentStats = {
          points: data.points ?? 0,
          reportsCount: data.reportsCount ?? 0,
          verificationsGiven: data.verificationsGiven ?? 0,
          issuesResolvedCount: data.issuesResolvedCount ?? 0,
          streakDays: data.streakDays ?? 0,
          reputationScore: data.reputationScore ?? 100,
        };
        setStats(currentStats);
        
        // Check and auto-award badges
        await checkAndAutoAward(uid, currentStats, data.badges || []);
      } else {
        // Create default profile for new citizen
        const defaultName = auth.currentUser?.displayName || 'Citizen Hero';
        setDisplayName(defaultName);
        const defaultStats = {
          points: 0,
          reportsCount: 0,
          verificationsGiven: 0,
          issuesResolvedCount: 0,
          streakDays: 0,
          reputationScore: 100,
        };
        setStats(defaultStats);
        try {
          await setDoc(userDocRef, {
            displayName: defaultName,
            role: 'citizen',
            homeWardId: 'WARD-47',
            preferredLanguage: 'en',
            badges: [],
            ...defaultStats,
            createdAt: new Date().toISOString()
          });
          await checkAndAutoAward(uid, defaultStats, []);
        } catch (e) {
          console.error("Failed to create default profile", e);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Load profile from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setEmail(user.email || '');
        await fetchUserProfile(user.uid);
      } else {
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaveLoading(true);

    try {
      // 1. Update Firebase Auth displayName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName });
      }

      // 2. Update Firestore user document
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        displayName,
        homeWardId,
        preferredLanguage,
        lastActivity: new Date().toISOString()
      });

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Simulation handlers to easily test point/badge unlocking
  const handleSimulateAction = async (type: 'report' | 'verify' | 'resolve' | 'streak') => {
    if (!userId) {
      toast.error('Please log in first.');
      return;
    }

    const toastId = toast.loading('Simulating activity...');
    try {
      let pointsGained = 0;
      const updatedStats = { ...stats };

      if (type === 'report') {
        updatedStats.reportsCount += 1;
        pointsGained = 100;
        updatedStats.points += pointsGained;
        toast.success('Simulation: Issue reported! +100 Points', { id: toastId });
      } else if (type === 'verify') {
        updatedStats.verificationsGiven += 1;
        pointsGained = 50;
        updatedStats.points += pointsGained;
        toast.success('Simulation: Issue verified! +50 Points', { id: toastId });
      } else if (type === 'resolve') {
        updatedStats.issuesResolvedCount += 1;
        pointsGained = 150;
        updatedStats.points += pointsGained;
        toast.success('Simulation: Issue resolved! +150 Points', { id: toastId });
      } else if (type === 'streak') {
        updatedStats.streakDays += 1;
        pointsGained = 20;
        updatedStats.points += pointsGained;
        toast.success('Simulation: Logged in! Streak +1 day, +20 Points', { id: toastId });
      }

      setStats(updatedStats);

      // Update Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        points: updatedStats.points,
        reportsCount: updatedStats.reportsCount,
        verificationsGiven: updatedStats.verificationsGiven,
        issuesResolvedCount: updatedStats.issuesResolvedCount,
        streakDays: updatedStats.streakDays,
        lastActivity: new Date().toISOString()
      });

      // Recalculate badges
      await checkAndAutoAward(userId, updatedStats, userBadges);
    } catch (err) {
      console.error('Simulation error:', err);
      toast.error('Simulation failed.', { id: toastId });
    }
  };

  const handleResetStats = async () => {
    if (!userId) return;
    const toastId = toast.loading('Resetting stats...');
    try {
      const resetStats = {
        points: 0,
        reportsCount: 0,
        verificationsGiven: 0,
        issuesResolvedCount: 0,
        streakDays: 0,
        reputationScore: 100,
      };
      setStats(resetStats);
      setUserBadges([]);

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        points: 0,
        reportsCount: 0,
        verificationsGiven: 0,
        issuesResolvedCount: 0,
        streakDays: 0,
        reputationScore: 100,
        badges: []
      });

      toast.success('Profile stats and badges reset successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset stats.', { id: toastId });
    }
  };

  const renderBadgeIcon = (iconType: string, className: string) => {
    switch (iconType) {
      case 'trophy': return <Trophy className={className} />;
      case 'award': return <Award className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'target': return <Target className={className} />;
      case 'activity': return <Activity className={className} />;
      case 'shield': return <ShieldCheck className={className} />;
      case 'sparkles': return <Sparkles className={className} />;
      default: return <Award className={className} />;
    }
  };

  if (profileLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-muted-foreground gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-civic-primary" />
        <p className="text-sm font-medium">Loading profile and badges data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
              alt={displayName} 
              className="w-16 h-16 rounded-full border-2 border-civic-primary/20 bg-muted"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-civic-primary text-white rounded-full flex items-center justify-center shadow-md">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {displayName}
              {stats.reputationScore >= 90 && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs gap-1 py-0 px-2">
                  <ShieldCheck className="w-3 h-3" /> Trusted Citizen
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="capitalize font-medium text-foreground/80">{role.replace('_', ' ')}</span>
              <span>•</span>
              <span>Home Ward: <span className="font-semibold text-foreground/80">{homeWardId}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center md:text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level Rank</p>
            <p className="text-lg font-bold text-civic-warning flex items-center md:justify-end gap-1 mt-1">
              <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
              {stats.points >= 500 ? 'Civic Hero' : stats.points >= 200 ? 'Active Guardian' : 'Seedling Citizen'}
            </p>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block" />
          <div className="text-center md:text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Points</p>
            <p className="text-2xl font-extrabold text-civic-primary mt-0.5">{stats.points}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'border-civic-primary text-civic-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <UserIcon className="w-4 h-4" />
          Profile Info
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'badges' ? 'border-civic-primary text-civic-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Award className="w-4 h-4" />
          Badges & Achievements
          {userBadges.length > 0 && (
            <Badge className="bg-civic-primary text-white h-5 px-1.5 min-w-5 justify-center rounded-full text-[10px] ml-1">
              {userBadges.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'simulator' ? 'border-civic-primary text-civic-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Sparkles className="w-4 h-4" />
          Simulation Sandbox
        </button>
      </div>

      {/* Active Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Stats Cards Column */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Civic Statistics</CardTitle>
                  <CardDescription>Your contribution history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-civic-primary" /> Reports Submitted
                    </span>
                    <span className="font-bold text-foreground">{stats.reportsCount}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verifications Provided
                    </span>
                    <span className="font-bold text-foreground">{stats.verificationsGiven}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Issues Resolved
                    </span>
                    <span className="font-bold text-foreground">{stats.issuesResolvedCount}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" /> Current Streak
                    </span>
                    <span className="font-bold text-foreground">{stats.streakDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> Reputation Score
                    </span>
                    <span className="font-bold text-emerald-500">{stats.reputationScore}/100</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Next Milestone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Earn <span className="font-semibold text-foreground">{Math.max(0, 500 - stats.points)}</span> more points to reach <span className="font-semibold text-foreground">Civic Hero</span> rank and unlock advanced voting capabilities.
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500" 
                      style={{ width: `${Math.min((stats.points / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-semibold">
                    <span>{stats.points} pts</span>
                    <span>500 pts</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Editing Form Column */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Edit Profile Information</CardTitle>
                  <CardDescription>Keep your profile details up-to-date.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">Registered Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        disabled 
                        className="bg-muted border-none h-11"
                      />
                      <p className="text-xs text-muted-foreground">Registered email address cannot be changed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-semibold">Full Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your full name"
                          className="bg-muted/30 border-border h-11 focus-visible:ring-civic-primary"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ward" className="font-semibold">Home Ward ID</Label>
                        <Input 
                          id="ward" 
                          type="text" 
                          value={homeWardId} 
                          onChange={(e) => setHomeWardId(e.target.value)}
                          placeholder="WARD-47"
                          className="bg-muted/30 border-border h-11 focus-visible:ring-civic-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="font-semibold">Preferred Language</Label>
                      <select 
                        id="language"
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full flex h-11 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-primary focus-visible:ring-offset-2"
                      >
                        <option value="en">English</option>
                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                      </select>
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-civic-primary hover:bg-civic-primary-dark text-white font-semibold h-11 gap-2"
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile Updates
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Civic Achievements</h3>
                <p className="text-sm text-muted-foreground">Unlock certificates and titles by filing quality infrastructure reports.</p>
              </div>
              <p className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Unlocked: <span className="text-civic-primary font-bold">{userBadges.length} / {ALL_BADGES.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = userBadges.includes(badge.id);
                const progress = badge.getProgress(stats);

                return (
                  <Card 
                    key={badge.id}
                    className={`relative border transition-all duration-300 overflow-hidden group ${isUnlocked ? `bg-surface border-border shadow-sm hover:shadow-md` : 'bg-muted/10 border-border/40 opacity-75'}`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                        <div className="absolute transform rotate-45 bg-civic-primary text-white text-[9px] font-bold text-center py-0.5 w-[80px] top-[14px] right-[-20px] shadow-sm tracking-widest uppercase">
                          Earned
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="pb-3 flex flex-row items-start gap-4">
                      <div className={`p-3 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${isUnlocked ? badge.colorClass : 'bg-muted text-muted-foreground border border-border'}`}>
                        {isUnlocked ? (
                          renderBadgeIcon(badge.iconType, "w-6 h-6")
                        ) : (
                          <Lock className="w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className={`text-base font-bold ${isUnlocked ? 'text-foreground' : 'text-foreground/60'}`}>
                          {badge.title}
                        </CardTitle>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          REQ: {badge.requirementText}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed h-10 overflow-hidden">
                        {badge.description}
                      </p>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span>Progress</span>
                          <span>{progress.current} / {progress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isUnlocked ? badge.bgIconClass : 'bg-muted-foreground/30'}`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'simulator' && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-civic-primary/20 bg-civic-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-civic-primary" />
                  <CardTitle className="text-lg font-bold text-civic-primary">Simulation Sandbox (Interactive Testing)</CardTitle>
                </div>
                <CardDescription className="text-foreground/70">
                  This developer utility permits you to simulate active citizen operations to increase your Firestore profile statistics and see badges unlock live with animation!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="hover:border-civic-primary/40 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-36">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Filing Issues</p>
                        <p className="text-2xl font-black text-foreground mt-1">{stats.reportsCount}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">+100 pts per report</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSimulateAction('report')}
                        className="bg-civic-primary hover:bg-civic-primary-dark text-white gap-1 w-full text-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> File Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-emerald-500/40 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-36">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Verifications</p>
                        <p className="text-2xl font-black text-foreground mt-1">{stats.verificationsGiven}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">+50 pts per verify</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSimulateAction('verify')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 w-full text-xs border-none"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Verify Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-indigo-500/40 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-36">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Resolutions</p>
                        <p className="text-2xl font-black text-foreground mt-1">{stats.issuesResolvedCount}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">+150 pts per resolve</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSimulateAction('resolve')}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1 w-full text-xs border-none"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Resolve Issue
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-orange-500/40 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-36">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Day Streak</p>
                        <p className="text-2xl font-black text-foreground mt-1">{stats.streakDays}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">+20 pts per login</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSimulateAction('streak')}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-1 w-full text-xs border-none"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Simulate Daily Login
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-4 border-t border-border pt-6 items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Sandbox Reset</h4>
                    <p className="text-xs text-muted-foreground">Erase your simulated stats to start fresh.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleResetStats}
                    className="h-9 px-4"
                  >
                    Reset Stats & Badges
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
