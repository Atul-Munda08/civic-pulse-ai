'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Flame, CheckCircle2, Award } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { User } from '@/packages/shared-types/src/user';

export function LeaderboardDialog() {
  const [open, setOpen] = useState(false);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      // Fetch top 50 users ordered by points
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const fetchedLeaders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setLeaders(fetchedLeaders);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeaders();
    }
  }, [open]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="font-mono text-sm text-muted-foreground w-5 text-center">{index + 1}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 bg-surface hover:bg-muted text-foreground border border-border shadow-sm">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">Leaderboard</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Award className="w-6 h-6 text-civic-primary" />
            Civic Heroes Leaderboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground animate-pulse">Loading rankings...</span>
            </div>
          ) : leaders.length > 0 ? (
            leaders.map((user, index) => (
              <div 
                key={user.id} 
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border border-transparent transition-colors",
                  index < 3 ? "bg-muted/50 border-border/50" : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface shadow-sm border border-border">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {user.displayName || 'Anonymous Citizen'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-civic-warning" />
                      {user.streakDays || 0} days
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-civic-success" />
                      {user.issuesResolvedCount || 0} resolved
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono font-bold text-civic-primary">
                    {user.points || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    pts
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <Trophy className="w-12 h-12 text-muted-foreground/30" />
              <p>No active citizens yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
