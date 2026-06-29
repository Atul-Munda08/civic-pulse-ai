import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <p className="text-muted-foreground mt-1">Review department performance and resolution trends.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>SLA compliance and resolution metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground font-medium">Analytics data is currently being processed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
