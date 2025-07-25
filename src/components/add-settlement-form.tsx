'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const settlementFormSchema = z.object({
  receiverId: z.string().cuid({ message: 'You must select a member.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

type SettlementFormValues = z.infer<typeof settlementFormSchema>;

interface AddSettlementFormProps {
  groupId: string;
  members: { id: string; name: string | null; email: string | null }[];
  currentUserId: string;
}

export function AddSettlementForm({ groupId, members, currentUserId }: AddSettlementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const otherMembers = members.filter((member) => member.id !== currentUserId);

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      receiverId: '',
      amount: undefined,
    },
  });

  const onSubmit: SubmitHandler<SettlementFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record settlement.');
      }

      toast.success('Settlement recorded!');
      router.refresh();
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
        <h3 className="text-lg font-medium">Record a Settlement</h3>
        <FormField
          control={form.control}
          name="receiverId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I paid</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {otherMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Payment'}
        </Button>
      </form>
    </Form>
  );
}
