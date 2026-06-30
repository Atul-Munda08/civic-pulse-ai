'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, AlertTriangle, ShieldCheck, Share2, CheckCircle2, CircleDashed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ReportIssueDialog } from '@/components/ReportIssueDialog';
import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';

const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 };

const STATUS_ORDER = ['REPORTED', 'AI_CLASSIFIED', 'IN_PROGRESS', 'RESOLVED'];

function StatusTracker({ status }: { status: string }) {
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
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full" />
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

export default function PublicMapPortal() {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const q = query(collection(db, 'issues'), limit(50));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIssues(list);
      });
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          console.error('No results found for the query');
        }
      } catch (error) {
        console.error('Error fetching geocode from Nominatim:', error);
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col">
      {/* Header overlay */}
      <header className="absolute top-0 w-full z-10 bg-gradient-to-b from-background/90 to-transparent p-4 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-border">
          <div className="w-6 h-6 rounded bg-civic-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">CP</span>
          </div>
          <h1 className="font-bold text-foreground tracking-tight">CivicPulse AI</h1>
          <span className="text-xs text-muted-foreground ml-2 font-medium">Public Portal</span>
        </div>
        <div className="pointer-events-auto">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "bg-surface/80 backdrop-blur shadow-sm font-semibold")}
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Floating Search Panel */}
      <div className="absolute top-20 left-4 z-10 w-80 pointer-events-auto">
        <Card className="shadow-lg border-border bg-surface/95 backdrop-blur">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg text-foreground">Explore Ward Health</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ward or area..." 
                className="pl-9 bg-muted/50" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 bg-muted rounded-lg flex flex-col justify-center items-center">
                <span className="text-2xl font-bold text-civic-primary">78</span>
                <span className="text-xs text-muted-foreground font-medium text-center">Ward Health Score</span>
              </div>
              <div className="p-3 bg-muted rounded-lg flex flex-col justify-center items-center">
                <span className="text-2xl font-bold text-foreground">1,245</span>
                <span className="text-xs text-muted-foreground font-medium text-center">Issues Resolved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Issue Popup (Mocked bottom sheet on mobile, card on desktop) */}
      {selectedIssue && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-auto">
          <Card className="shadow-xl border-border bg-surface">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-civic-road/10 text-civic-road border-civic-road/30 font-bold uppercase">
                  {selectedIssue.category || 'OTHER'}
                </Badge>
                <button onClick={() => setSelectedIssueId(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <CardTitle className="text-xl">{selectedIssue.subCategory || 'Civic Issue'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {selectedIssue.aiDescription || 'No description provided.'}
              </p>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-civic-warning" />
                  <span>Severity: <strong className="text-foreground">{selectedIssue.severity || 'Medium'}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-civic-success" />
                  <span>Verified by <strong>12</strong></span>
                </div>
              </div>
              
              <StatusTracker status={selectedIssue.status || 'REPORTED'} />

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-civic-primary hover:bg-civic-primary-dark gap-2">
                  <ShieldCheck className="w-4 h-4" /> Verify (GPS Req)
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 w-full bg-muted flex items-center justify-center">
        {(!process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') ? (
          <div className="text-center p-8 bg-surface rounded-xl shadow-sm border border-border max-w-md mx-auto">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              Please configure your Google Maps API key in the environment variables to view the map.
            </p>
          </div>
        ) : (
          <APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY}>
            <Map
              defaultZoom={13}
              center={mapCenter}
              onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
              mapId="CIVIC_PULSE_PUBLIC_MAP"
              disableDefaultUI={true}
              className="w-full h-full"
            >
              {issues.map(issue => {
                if (!issue.geoPoint) return null;
                const lat = issue.geoPoint.lat;
                const lng = issue.geoPoint.lng;
                
                let color = '#D85A30'; // default coral
                if (issue.category === 'WATER') color = '#185FA5';
                else if (issue.category === 'LIGHTING') color = '#BA7517';
                else if (issue.category === 'WASTE') color = '#3B6D11';
                else if (issue.category === 'SEWAGE') color = '#533489';
                
                return (
                  <AdvancedMarker 
                    key={issue.id}
                    position={{ lat, lng }}
                    onClick={() => setSelectedIssueId(issue.id)}
                  >
                    <Pin background={color} borderColor="#ffffff" glyphColor="#ffffff" />
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        )}
      </div>

      <ReportIssueDialog />
    </div>
  );
}
