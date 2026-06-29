import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WorkOrdersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Work Orders</h2>
        <p className="text-muted-foreground mt-1">Manage and track assigned work orders.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Work Orders</CardTitle>
          <CardDescription>View all active work orders in your jurisdiction.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground font-medium">No work orders found matching your criteria.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
