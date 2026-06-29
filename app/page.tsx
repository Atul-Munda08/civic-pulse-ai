'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, AlertTriangle, ShieldCheck, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ReportIssueDialog } from '@/components/ReportIssueDialog';

const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 };

export default function PublicMapPortal() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [searchQuery, setSearchQuery] = useState('');

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
                <Badge variant="outline" className="bg-civic-road/10 text-civic-road border-civic-road/30 font-bold">
                  LARGE POTHOLE
                </Badge>
                <button onClick={() => setSelectedIssue(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <CardTitle className="text-xl">MG Road Junction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-muted-foreground">Issue Photo</span>
                </div>
                {/* AI Detected Polygon Overlay mock */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <polygon points="30,40 70,35 75,60 25,65" fill="rgba(226, 75, 74, 0.3)" stroke="#E24B4A" strokeWidth="2" />
                </svg>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-civic-warning" />
                  <span>Severity: <strong className="text-foreground">High</strong></span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-civic-success" />
                  <span>Verified by <strong>12</strong></span>
                </div>
              </div>

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
              <AdvancedMarker 
                position={{ lat: 12.9726, lng: 77.5956 }}
                onClick={() => setSelectedIssue('CIV-0042')}
              >
                <Pin background="#D85A30" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
              
              <AdvancedMarker 
                position={{ lat: 12.9700, lng: 77.5920 }}
                onClick={() => setSelectedIssue('CIV-0056')}
              >
                <Pin background="#185FA5" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        )}
      </div>

      <ReportIssueDialog />
    </div>
  );
}
