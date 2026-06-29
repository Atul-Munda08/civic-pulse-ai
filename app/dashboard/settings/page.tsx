import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and notification preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Configuration</CardTitle>
          <CardDescription>Update your personal information and department settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground font-medium">Settings configuration options will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
