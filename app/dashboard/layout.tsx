'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Map as MapIcon, List, BarChart3, Settings, LogOut, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserName(user.displayName || 'Ward Officer');
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'Ward Officer');
          }
        } catch (e) {
          console.error(e);
        }
        setIsLoading(false);

        // Real-time unread notifications subscription
        try {
          const notificationsRef = collection(db, 'notifications');
          const q = query(
            notificationsRef,
            where('userId', '==', user.uid),
            where('read', '==', false)
          );
          unsubscribeNotifications = onSnapshot(q, (snapshot) => {
            setUnreadNotifications(snapshot.size);
          }, (err) => {
            console.error("Notifications fetch error in layout:", err);
          });
        } catch (err) {
          console.error("Error setting up notifications subscription:", err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="w-8 h-8 rounded bg-civic-primary flex items-center justify-center mr-3">
            <span className="text-white font-bold">CP</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">CivicPulse Ops</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 tracking-wider">MAIN</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
            <Home className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Overview</span>
          </Link>
          
          {userRole === 'ward_officer' ? (
            <>
              <Link href="/dashboard/queue" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <List className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">AI Queue</span>
                <span className="ml-auto bg-civic-critical text-white text-[10px] font-bold px-2 py-0.5 rounded-full">12</span>
              </Link>
              <Link href="/dashboard/map" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <MapIcon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Ops Map</span>
              </Link>
              <Link href="/dashboard/work-orders" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <List className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Work Orders</span>
              </Link>
              
              <div className="text-xs font-semibold text-muted-foreground mt-8 mb-4 px-2 tracking-wider">MANAGEMENT</div>
              <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Analytics</span>
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/my-reports" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <List className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">My Reports</span>
              </Link>
              <Link href="/dashboard/map" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <MapIcon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Community Map</span>
              </Link>
              
              <div className="text-xs font-semibold text-muted-foreground mt-8 mb-4 px-2 tracking-wider">ACCOUNT</div>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Profile & Badges</span>
              </Link>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole === 'ward_officer' ? 'Ward Officer' : userRole}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex-shrink-0 border-b border-border bg-surface flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground mr-4">
              View Public Map
            </Link>
            <Link 
              href="/dashboard/notifications" 
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute top-1 right-1 bg-civic-critical text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-surface animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-civic-critical rounded-full border border-surface"></span>
              )}
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
