'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Activity, TrendingUp, Trophy, Flame, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const slaData = [
  { day: 'Mon', compliance: 78, overdue: 12 },
  { day: 'Tue', compliance: 82, overdue: 10 },
  { day: 'Wed', compliance: 85, overdue: 8 },
  { day: 'Thu', compliance: 81, overdue: 14 },
  { day: 'Fri', compliance: 86, overdue: 9 },
  { day: 'Sat', compliance: 89, overdue: 5 },
  { day: 'Sun', compliance: 92, overdue: 4 },
];

const topIssues = [
  { id: 'CIV-0042', type: 'ROAD', severity: 9, priority: 94, location: 'MG Road', status: 'OVERDUE' },
  { id: 'CIV-0056', type: 'WATER', severity: 8, priority: 88, location: 'Indiranagar 100ft', status: 'IN_PROGRESS' },
  { id: 'CIV-0071', type: 'WASTE', severity: 7, priority: 76, location: 'Koramangala 4th', status: 'ASSIGNED' },
];

export default function DashboardOverview() {
  const [userRole, setUserRole] = useState<'citizen' | 'ward_officer' | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || 'User');
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role as 'citizen' | 'ward_officer');
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!userRole) return <div className="p-8 text-muted-foreground">Loading dashboard...</div>;

  if (userRole === 'citizen') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, {userName}</h2>
            <p className="text-muted-foreground mt-1">Track your civic impact and active reports.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Rank</p>
              <p className="font-semibold text-civic-warning flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Civic Hero
              </p>
            </div>
            <div className="w-px h-10 bg-border mx-2" />
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Points</p>
              <p className="font-semibold text-civic-primary">847</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Reports Filed</p>
                <Activity className="h-4 w-4 text-foreground/50" />
              </div>
              <h2 className="text-3xl font-bold">23</h2>
              <p className="text-xs text-civic-success mt-1">+3 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Issues Resolved</p>
                <CheckCircle2 className="h-4 w-4 text-civic-success" />
              </div>
              <h2 className="text-3xl font-bold text-civic-success">18</h2>
              <p className="text-xs text-muted-foreground mt-1">78% resolution rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Verifications</p>
                <Target className="h-4 w-4 text-civic-info" />
              </div>
              <h2 className="text-3xl font-bold">41</h2>
              <p className="text-xs text-muted-foreground mt-1">Credibility builder</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <Flame className="h-4 w-4 text-civic-warning" />
              </div>
              <h2 className="text-3xl font-bold text-civic-warning">12 Days</h2>
              <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ward 47 Health Score</CardTitle>
              <CardDescription>Jayanagar, Bengaluru</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-8 border-civic-warning flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">62</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">out of 100</p>
                  <p className="text-sm text-civic-critical mt-1">▼ 4 pts from last month</p>
                  <p className="text-xs text-muted-foreground mt-2">City avg: 71 · Your ward: 62</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>My Open Reports</CardTitle>
                  <CardDescription>Status of your recent submissions</CardDescription>
                </div>
                <Badge className="bg-civic-primary">5 Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[ 
                  { title: 'Large pothole — MG Road', status: 'SLA Breached', color: 'bg-civic-critical', desc: '5 days overdue' },
                  { title: 'Water pipe leaking — 5th Cross', status: 'At Risk', color: 'bg-civic-warning', desc: '18h remaining' },
                  { title: 'Street light out — 12th Main', status: 'In Progress', color: 'bg-civic-info', desc: '4 days left' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <Badge variant="outline" className={`mt-1 text-[10px] ${item.color.replace('bg-', 'text-')} ${item.color.replace('bg-', 'border-')}`}>{item.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Ward 142 Overview</h2>
        <p className="text-muted-foreground mt-1">Real-time civic infrastructure status and metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
              <Activity className="h-4 w-4 text-civic-info" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-foreground">124</h2>
              <span className="text-sm text-civic-success font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> -12%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">SLA Compliance</p>
              <CheckCircle2 className="h-4 w-4 text-civic-success" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-foreground">86%</h2>
              <span className="text-sm text-civic-success font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +4%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
              <Clock className="h-4 w-4 text-civic-warning" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-foreground">4.2d</h2>
              <span className="text-sm text-civic-success font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> -0.5d
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-civic-critical border-opacity-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-civic-critical">Overdue Work Orders</p>
              <AlertCircle className="h-4 w-4 text-civic-critical" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-civic-critical">12</h2>
              <span className="text-sm text-civic-warning font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +2
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Compliance Trend</CardTitle>
            <CardDescription>7-day compliance percentage vs overdue issues</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DFD3" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888780', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888780', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="compliance" stroke="#1D9E75" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Queue */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Priority Queue</CardTitle>
              <CardDescription>Highest priority pending issues</CardDescription>
            </div>
            <Link href="/dashboard/queue" className="text-xs text-civic-primary font-medium hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {topIssues.map((issue) => (
                <div key={issue.id} className="flex flex-col space-y-2 p-3 bg-muted rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-foreground">{issue.id}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold
                        ${issue.type === 'ROAD' ? 'text-civic-road border-civic-road/30 bg-civic-road/10' : ''}
                        ${issue.type === 'WATER' ? 'text-civic-water border-civic-water/30 bg-civic-water/10' : ''}
                        ${issue.type === 'WASTE' ? 'text-civic-waste border-civic-waste/30 bg-civic-waste/10' : ''}
                      `}>
                        {issue.type}
                      </Badge>
                    </div>
                    <Badge className="bg-civic-critical/10 text-civic-critical hover:bg-civic-critical/20 border-none">
                      Score: {issue.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[140px]">{issue.location}</span>
                    <span className={`font-medium ${issue.status === 'OVERDUE' ? 'text-civic-critical' : ''}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
