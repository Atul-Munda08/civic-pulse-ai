'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, MapPin, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MOCK_QUEUE = [
  { 
    id: 'CIV-0042', 
    category: 'ROAD', 
    subCategory: 'LARGE POTHOLE',
    severity: 9, 
    priority: 94, 
    location: 'MG Road Junction', 
    status: 'AI_CLASSIFIED',
    timeElapsed: '2h 15m',
    confidence: 0.92
  },
  { 
    id: 'CIV-0056', 
    category: 'WATER', 
    subCategory: 'PIPE BURST',
    severity: 8, 
    priority: 88, 
    location: 'Indiranagar 100ft Rd', 
    status: 'AI_CLASSIFIED',
    timeElapsed: '4h 30m',
    confidence: 0.85
  },
  { 
    id: 'CIV-0071', 
    category: 'WASTE', 
    subCategory: 'GARBAGE DUMP',
    severity: 7, 
    priority: 76, 
    location: 'Koramangala 4th Block', 
    status: 'COMMUNITY_VERIFIED',
    timeElapsed: '1d 2h',
    confidence: 0.98
  }
];

export default function QueuePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Issue Queue</h2>
          <p className="text-muted-foreground mt-1">AI-prioritized incoming reports requiring assignment.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filter</Button>
          <Button className="bg-civic-primary hover:bg-civic-primary-dark">Bulk Assign</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Priority Score</TableHead>
              <TableHead>Status / Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_QUEUE.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className={`w-fit text-[10px] uppercase font-bold
                      ${issue.category === 'ROAD' ? 'text-civic-road border-civic-road/30 bg-civic-road/10' : ''}
                      ${issue.category === 'WATER' ? 'text-civic-water border-civic-water/30 bg-civic-water/10' : ''}
                      ${issue.category === 'WASTE' ? 'text-civic-waste border-civic-waste/30 bg-civic-waste/10' : ''}
                    `}>
                      {issue.category} • {(issue.confidence * 100).toFixed(0)}% AI
                    </Badge>
                    <span className="text-xs text-muted-foreground">{issue.subCategory}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
                    {issue.location}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {issue.severity >= 8 && <AlertTriangle className="w-4 h-4 text-civic-critical" />}
                    <span className={`font-bold ${issue.severity >= 8 ? 'text-civic-critical' : 'text-foreground'}`}>
                      {issue.priority}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-semibold">{issue.status.replace('_', ' ')}</span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {issue.timeElapsed}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Review Details</DropdownMenuItem>
                      <DropdownMenuItem>Assign Team</DropdownMenuItem>
                      <DropdownMenuItem className="text-civic-critical">Reject / Spam</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
