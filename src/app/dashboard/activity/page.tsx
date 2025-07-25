import { ActivityFeed } from '@/components/activity-feed';
import { Suspense } from 'react';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">
          A log of all recent expenses and settlements across your groups.
        </p>
      </div>
      <Suspense fallback={<p>Loading feed...</p>}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}

