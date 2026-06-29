'use client';

import { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAP_CENTER = { lat: 12.9716, lng: 77.5946 };

// Mock data for issues
const MOCK_ISSUES = [
  { id: '1', lat: 12.9726, lng: 77.5956, title: 'Large pothole — MG Road', department: 'pwd', priority: 'critical', type: 'road', color: '#D85A30', desc: 'Deep pothole causing traffic slowdowns', sla: '5 days overdue' },
  { id: '2', lat: 12.9700, lng: 77.5920, title: 'Water pipe leaking — 5th Cross', department: 'water', priority: 'overdue', type: 'water', color: '#185FA5', desc: 'Continuous leak for 2 days', sla: '18h remaining' },
  { id: '3', lat: 12.9750, lng: 77.5890, title: 'Garbage pile near park', department: 'waste', priority: 'normal', type: 'waste', color: '#3B6D11', desc: 'Uncollected waste attracting pests', sla: '12 days left' },
  { id: '4', lat: 12.9680, lng: 77.5980, title: 'Broken footpath', department: 'pwd', priority: 'normal', type: 'road', color: '#D85A30', desc: 'Pedestrians forced onto road', sla: '19 days left' },
];

export default function OpsMapPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [priority, setPriority] = useState('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter(issue => {
      const matchSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || issue.desc.toLowerCase().includes(search.toLowerCase());
      const matchDept = department === 'all' || issue.department === department;
      const matchPriority = priority === 'all' || issue.priority === priority;
      return matchSearch && matchDept && matchPriority;
    });
  }, [search, department, priority]);

  const selectedIssue = MOCK_ISSUES.find(issue => issue.id === selectedIssueId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative -mx-8 -my-8">
      {/* Map Header / Filters overlay */}
      <div className="absolute top-4 left-4 z-10 w-96 space-y-2 pointer-events-auto">
        <Card className="shadow-lg border-border bg-surface/95 backdrop-blur">
          <CardContent className="p-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search work order or location..." 
                className="pl-9 h-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="pwd">PWD (Roads)</SelectItem>
                  <SelectItem value="water">BWSSB (Water)</SelectItem>
                  <SelectItem value="waste">BBMP (Waste)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 right-6 z-10 pointer-events-auto bg-surface/90 backdrop-blur p-3 rounded-lg border border-border shadow-md text-xs">
        <div className="font-semibold mb-2">Issue Types</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D85A30]"></div> Roads</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#185FA5]"></div> Water</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3B6D11]"></div> Waste</div>
        </div>
      </div>

      <div className="flex-1 w-full bg-muted flex items-center justify-center">
        {(!process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') ? (
          <div className="text-center p-8 bg-surface rounded-xl shadow-sm border border-border max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-2">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              Please configure your Google Maps API key in the environment variables to view the map.
            </p>
          </div>
        ) : (
          <APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY}>
            <Map
              defaultZoom={13}
              defaultCenter={MAP_CENTER}
              mapId="CIVIC_PULSE_OPS_MAP"
              disableDefaultUI={true}
              className="w-full h-full"
            >
              {filteredIssues.map((issue) => (
                <AdvancedMarker 
                  key={issue.id}
                  position={{ lat: issue.lat, lng: issue.lng }}
                  onClick={() => setSelectedIssueId(issue.id)}
                >
                  <Pin background={issue.color} borderColor="#ffffff" glyphColor="#ffffff" scale={issue.priority === 'critical' ? 1.2 : 1} />
                </AdvancedMarker>
              ))}

              {selectedIssue && (
                <InfoWindow
                  position={{ lat: selectedIssue.lat, lng: selectedIssue.lng }}
                  onCloseClick={() => setSelectedIssueId(null)}
                >
                  <div className="p-1 max-w-[200px]">
                    <div className="font-bold text-sm mb-1">{selectedIssue.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">{selectedIssue.desc}</div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {selectedIssue.priority === 'critical' ? (
                        <span className="flex items-center text-red-600 gap-1"><AlertTriangle className="w-3 h-3" /> Critical</span>
                      ) : (
                        <span className="flex items-center text-orange-600 gap-1"><Clock className="w-3 h-3" /> {selectedIssue.sla}</span>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
