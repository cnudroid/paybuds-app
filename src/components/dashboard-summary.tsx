"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface SummaryData {
  totalOwed: number;
  totalYouAreOwed: number;
  netBalance: number;
}

export function DashboardSummary() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        toast.error('Could not load dashboard summary.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>You Owe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Loading...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>You Are Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return null; // Or some error state
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">${summary.totalOwed.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total amount you owe across all groups</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Are Owed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">${summary.totalYouAreOwed.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total amount others owe you</p>
        </CardContent>
      </Card>
    </div>
  );
}
