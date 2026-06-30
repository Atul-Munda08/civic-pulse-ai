'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Activity, FileText, CheckCircle2, CircleDashed } from 'lucide-react';

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

const STATUS_ORDER = ['REPORTED', 'AI_CLASSIFIED', 'IN_PROGRESS', 'RESOLVED'];

function StatusTracker({ status }: { status: string }) {
  // Map specific statuses to our 4-step timeline for simplicity
  let currentStepIndex = 0;
  if (status === 'RESOLVED' || status === 'COMMUNITY_CONFIRMED') {
    currentStepIndex = 3;
  } else if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
    currentStepIndex = 2;
  } else if (status === 'AI_CLASSIFIED' || status === 'COMMUNITY_VERIFIED') {
    currentStepIndex = 1;
  }
  
  return (
    <div className="w-full mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between relative px-2">
        {/* Background line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full" />
        
        {/* Active line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / (STATUS_ORDER.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-civic-primary rounded-full origin-left"
        />
        
        {STATUS_ORDER.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isActive = idx === currentStepIndex;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-1 bg-surface px-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.15 }}
                className="bg-surface rounded-full"
              >
                {isCompleted ? (
                  <CheckCircle2 className={`w-5 h-5 ${isActive ? 'text-civic-primary animate-pulse' : 'text-civic-primary'}`} />
                ) : (
                  <CircleDashed className="w-5 h-5 text-muted-foreground/40" />
                )}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase ${isCompleted ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {step.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyReportsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeIssues: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        
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
                status: data.status || 'REPORTED',
                reportedAt: data.reportedAt,
                geoPoint: data.geoPoint
              });
            });
            // Sort by reportedAt descending in client to avoid requiring a composite index
            list.sort((a, b) => {
              const timeA = a.reportedAt?.toMillis ? a.reportedAt.toMillis() : 0;
              const timeB = b.reportedAt?.toMillis ? b.reportedAt.toMillis() : 0;
              return timeB - timeA;
            });
            setIssues(list);
            setLoading(false);
          }, (err) => {
            console.error("Error fetching issues:", err);
            setLoading(false);
          });
        } catch (err) {
          console.error("Error configuring issues listener:", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeIssues) unsubscribeIssues();
    };
  }, []);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-civic-primary" />
          My Reports
        </h2>
        <p className="text-muted-foreground mt-1">
          Track the status of all civic issues you have reported.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-civic-primary" />
            Report History ({issues.length})
          </CardTitle>
          <CardDescription>
            A chronological list of your contributions to the community
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
              <Clock className="w-6 h-6 animate-spin text-civic-primary" />
              <p className="text-sm font-medium">Loading reports...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <div className="p-4 bg-muted rounded-full mb-4">
                <FileText className="w-10 h-10 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">No reports yet!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                You haven&apos;t reported any civic issues yet. Click &quot;Report Issue&quot; to make your first contribution!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {issues.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-4 bg-surface hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {issue.category} &bull; {issue.subCategory}
                      </h3>
                      <Badge className={`text-[10px] uppercase font-bold border-none
                        ${issue.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : ''}
                        ${issue.status === 'COMMUNITY_VERIFIED' ? 'bg-amber-500 text-white' : ''}
                        ${issue.status === 'AI_CLASSIFIED' ? 'bg-blue-500 text-white' : ''}
                        ${issue.status === 'REPORTED' ? 'bg-gray-500 text-white' : ''}
                      `}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.aiDescription || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(issue.reportedAt)}
                      </span>
                      {issue.geoPoint && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {issue.geoPoint.lat.toFixed(4)}, {issue.geoPoint.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 md:w-32 flex-shrink-0">
                     <div className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                       Severity: {issue.severity}/10
                     </div>
                  </div>
                  <div className="w-full mt-2 basis-full">
                    <StatusTracker status={issue.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
