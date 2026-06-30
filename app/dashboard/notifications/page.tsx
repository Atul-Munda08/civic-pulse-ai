'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Check, 
  Eye, 
  Sparkles, 
  MapPin, 
  Clock, 
  Activity, 
  PlusCircle, 
  Megaphone,
  FileText
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId: string;
  issueId: string;
  issueTitle: string;
  type: 'verification' | 'resolution' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

interface IssueItem {
  id: string;
  category: string;
  subCategory: string;
  severity: number;
  aiDescription: string;
  status: string;
  reportedAt: any;
  geoPoint?: { lat: number; lng: number };
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(true);

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;
    let unsubscribeIssues: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        
        // 1. Subscribe to notifications in real-time
        try {
          const notificationsRef = collection(db, 'notifications');
          const notificationsQuery = query(
            notificationsRef,
            where('userId', '==', user.uid)
          );

          unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
            const list: NotificationItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                userId: data.userId,
                issueId: data.issueId,
                issueTitle: data.issueTitle,
                type: data.type,
                title: data.title,
                message: data.message,
                read: data.read ?? false,
                createdAt: data.createdAt,
              });
            });
            // Sort client side
            list.sort((a, b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
              return timeB - timeA;
            });
            setNotifications(list);
            setLoading(false);
          }, (err) => {
            console.error("Error fetching notifications:", err);
            setLoading(false);
          });
        } catch (err) {
          console.error("Error configuring notifications listener:", err);
          setLoading(false);
        }

        // 2. Subscribe to user's reported issues in real-time
        try {
          const issuesRef = collection(db, 'issues');
          const issuesQuery = query(
            issuesRef,
            where('reporterId', '==', user.uid)
          );

          unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
            const list: IssueItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                category: data.category || 'OTHER',
                subCategory: data.subCategory || 'UNKNOWN',
                severity: data.severity || 5,
                aiDescription: data.aiDescription || '',
                status: data.status || 'AI_CLASSIFIED',
                reportedAt: data.reportedAt,
              });
            });
            list.sort((a, b) => {
              const timeA = a.reportedAt?.toMillis ? a.reportedAt.toMillis() : 0;
              const timeB = b.reportedAt?.toMillis ? b.reportedAt.toMillis() : 0;
              return timeB - timeA;
            });
            setIssues(list);
            setIssuesLoading(false);
          }, (err) => {
            console.error("Error fetching issues:", err);
            setIssuesLoading(false);
          });
        } catch (err) {
          console.error("Error configuring issues listener:", err);
          setIssuesLoading(false);
        }
      } else {
        setLoading(false);
        setIssuesLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeIssues) unsubscribeIssues();
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) {
      toast.info("All notifications are already marked as read.");
      return;
    }

    const toastId = toast.loading("Marking all as read...");
    try {
      const batch = writeBatch(db);
      unread.forEach((item) => {
        const docRef = doc(db, 'notifications', item.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
      toast.success("All notifications marked as read!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark notifications as read.", { id: toastId });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await deleteDoc(docRef);
      toast.success("Notification deleted.");
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Failed to delete notification.");
    }
  };

  const handleClearAll = async () => {
    if (!userId || notifications.length === 0) return;
    const toastId = toast.loading("Clearing notification history...");
    try {
      const batch = writeBatch(db);
      notifications.forEach((item) => {
        const docRef = doc(db, 'notifications', item.id);
        batch.delete(docRef);
      });
      await batch.commit();
      toast.success("Notification history cleared!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear notifications.", { id: toastId });
    }
  };

  // Simulation: Create a sample issue quickly
  const handleCreateMockIssue = async () => {
    if (!userId) return;
    const toastId = toast.loading("Injecting simulated report...");
    try {
      const categories = ['ROAD', 'WATER', 'WASTE'];
      const descriptions = [
        'Massive crater-sized pothole blocking Jayanagar 4th Block Main Road.',
        'Burst drinking water pipe flooding the pedestrian sidewalk.',
        'Unauthorized pile of garbage attracting flies and stray animals.'
      ];
      const subcategories = ['LARGE POTHOLE', 'PIPE BURST', 'GARBAGE DUMP'];
      
      const randIdx = Math.floor(Math.random() * 3);

      await addDoc(collection(db, 'issues'), {
        category: categories[randIdx],
        subCategory: subcategories[randIdx],
        severity: 7 + randIdx,
        priorityScore: (7 + randIdx) * 10,
        aiConfidence: 0.92,
        aiDescription: descriptions[randIdx],
        riskToLife: randIdx === 1,
        status: 'AI_CLASSIFIED',
        geoPoint: { lat: 12.9716, lng: 77.5946 },
        reporterId: userId,
        reportedAt: serverTimestamp(),
      });

      toast.success("Simulated civic report added to database!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create simulated report.", { id: toastId });
    }
  };

  // Simulation: Trigger Officer Verification
  const handleSimulateVerify = async (issue: IssueItem) => {
    if (!userId) return;
    const toastId = toast.loading("Simulating officer verification...");
    try {
      // 1. Update issue status to COMMUNITY_VERIFIED
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, { status: 'COMMUNITY_VERIFIED' });

      // 2. Add notification
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        issueId: issue.id,
        issueTitle: `${issue.subCategory} — ${issue.category}`,
        type: 'verification',
        title: 'Report Verified by Officer',
        message: `Your report about the ${issue.subCategory.toLowerCase()} has been verified by the Ward Officer and assigned to the active engineering team.`,
        read: false,
        createdAt: serverTimestamp()
      });

      // 3. Increment user verifications count and points in user document
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
        if (!userDoc.empty) {
          const userSnap = userDoc.docs[0];
          const currentPoints = userSnap.data().points || 0;
          const currentVerifications = userSnap.data().verificationsGiven || 0;
          await updateDoc(doc(db, 'users', userId), {
            points: currentPoints + 30,
            verificationsGiven: currentVerifications + 1
          });
        }
      } catch (userErr) {
        console.error("Could not update user stats", userErr);
      }

      toast.success("Successfully verified! Check notifications above.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Simulation failed.", { id: toastId });
    }
  };

  // Simulation: Trigger Officer Resolution
  const handleSimulateResolve = async (issue: IssueItem) => {
    if (!userId) return;
    const toastId = toast.loading("Simulating issue resolution...");
    try {
      // 1. Update issue status to RESOLVED
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, { status: 'RESOLVED' });

      // 2. Add notification
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        issueId: issue.id,
        issueTitle: `${issue.subCategory} — ${issue.category}`,
        type: 'resolution',
        title: 'Issue Resolved! 🎉',
        message: `Success! The Jayanagar Municipal Council has repaired and resolved the ${issue.subCategory.toLowerCase()} issue. Thank you for your civic surveillance!`,
        read: false,
        createdAt: serverTimestamp()
      });

      // 3. Increment points and resolved issues count in user document
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
        if (!userDoc.empty) {
          const userSnap = userDoc.docs[0];
          const currentPoints = userSnap.data().points || 0;
          const currentResolved = userSnap.data().issuesResolvedCount || 0;
          await updateDoc(doc(db, 'users', userId), {
            points: currentPoints + 100,
            issuesResolvedCount: currentResolved + 1
          });
        }
      } catch (userErr) {
        console.error("Could not update user stats", userErr);
      }

      toast.success("Issue resolved! Dynamic notification generated.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Simulation failed.", { id: toastId });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return (
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'resolution':
        return (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-civic-primary" />
            Civic Notification Center
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time status updates on your submitted issues and verification activities.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-9"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Mark All as Read
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs h-9 text-civic-critical hover:text-civic-critical hover:bg-civic-critical/5"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear History
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notifications Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">Recent Notifications</CardTitle>
                  <CardDescription>Status changes regarding your feedback</CardDescription>
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge className="bg-civic-critical text-white">
                    {notifications.filter(n => !n.read).length} Unread
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
                  <Clock className="w-6 h-6 animate-spin text-civic-primary" />
                  <p className="text-sm font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Bell className="w-10 h-10 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">All caught up!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    No notifications available. When the municipal office verifies or resolves your reported issues, updates will appear here!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  <AnimatePresence initial={false}>
                    {notifications.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-start gap-4 p-5 transition-colors relative group ${!item.read ? 'bg-civic-primary/5 border-l-2 border-civic-primary' : 'bg-surface'}`}
                      >
                        {getNotificationIcon(item.type)}
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-sm font-bold ${!item.read ? 'text-foreground' : 'text-foreground/80'}`}>
                              {item.title}
                            </h4>
                            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            {item.issueTitle}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed pt-1 max-w-xl">
                            {item.message}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          {!item.read && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleMarkAsRead(item.id)}
                              className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeleteNotification(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-civic-critical hover:bg-civic-critical/5"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Submissions & Simulation Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-dashed border-2 border-border bg-muted/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-civic-primary" />
                <CardTitle className="text-base font-bold">Simulator Controls</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Ward officers verify or resolve issues in their internal portal. Simulate this action to test.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleCreateMockIssue}
                className="w-full text-xs h-10 gap-2 bg-civic-primary hover:bg-civic-primary-dark text-white font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                Inject Simulated Report
              </Button>
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Inserts a realistic Jayanagar issue directly into Firestore. Then, use the action buttons below to verify or resolve it!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-civic-primary" />
                My Active Reports ({issues.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time reports bound to your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {issuesLoading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading reports...</span>
                </div>
              ) : issues.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground border-t border-border">
                  <p className="text-xs font-semibold">No reported issues found.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Click &quot;Inject Simulated Report&quot; above or &quot;Report Issue&quot; in the dashboard bottom corner to add an issue to your account!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border border-t border-border">
                  {issues.map((issue) => (
                    <div key={issue.id} className="p-4 space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-foreground">
                              {issue.category}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              • {issue.subCategory}
                            </span>
                          </div>
                          
                          <Badge className={`text-[9px] uppercase font-bold border-none
                            ${issue.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : ''}
                            ${issue.status === 'COMMUNITY_VERIFIED' ? 'bg-amber-500 text-white' : ''}
                            ${issue.status === 'AI_CLASSIFIED' ? 'bg-blue-500 text-white' : ''}
                          `}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {issue.aiDescription}
                        </p>
                      </div>

                      {/* Simulator actions per issue */}
                      {issue.status !== 'RESOLVED' && (
                        <div className="flex gap-2 pt-1">
                          {issue.status === 'AI_CLASSIFIED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSimulateVerify(issue)}
                              className="flex-1 text-[10px] h-7 border-amber-500/30 text-amber-600 hover:bg-amber-50 gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verify (Simulate)
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSimulateResolve(issue)}
                            className="flex-1 text-[10px] h-7 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve (Simulate)
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
