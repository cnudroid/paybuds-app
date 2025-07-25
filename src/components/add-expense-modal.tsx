"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, Group, GroupMember } from '@prisma/client';

const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  payerId: z.string().min(1, 'Payer is required.'),
  splitType: z.enum(['equally', 'percentage'], { required_error: 'Split method is required.' }),
  participants: z.array(z.object({
    userId: z.string(),
    checked: z.boolean(),
    percentage: z.coerce.number().min(0).optional(),
  })).min(1).refine((participants) => participants.some(p => p.checked), {
    message: 'At least one participant must be selected.',
    path: [0, 'checked'],
  }),
}).refine((data) => {
  if (data.splitType === 'percentage') {
    const total = data.participants
      .filter(p => p.checked)
      .reduce((sum, p) => sum + (p.percentage || 0), 0);
    return Math.abs(total - 100) < 0.01;
  }
  return true;
}, {
  message: 'Percentages must add up to 100.',
  path: ['participants'],
});

type GroupWithMembers = Group & { members: (GroupMember & { user: User })[] };

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

function AddExpenseForm({ group, onFinished }: { group: GroupWithMembers; onFinished: () => void }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      payerId: '',
      splitType: 'equally',
      participants: group.members.map(member => ({ userId: member.user.id, checked: true, percentage: 0 })),
    },
  });

  const { fields, update } = useFieldArray({ control: form.control, name: 'participants' });
  const splitType = form.watch('splitType');

  async function onSubmit(values: z.infer<typeof expenseFormSchema>) {
    try {
      const response = await fetch(`/api/groups/${group.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success('Expense added successfully!');
      onFinished();
      router.refresh();
    } catch (error) {
      toast.error('Failed to add expense.', { description: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields go here - similar to EditExpenseForm */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Dinner, rent, etc." {...field} />
              </FormControl>
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
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid by</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {group.members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Split</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="equally" />
                    </FormControl>
                    <FormLabel className="font-normal">Equally</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="percentage" />
                    </FormControl>
                    <FormLabel className="font-normal">By Percentage</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <h4 className="mb-2 font-medium">Participants</h4>
          {fields.map((field, index) => {
            const member = group.members.find(m => m.userId === field.userId);
            return (
              <FormField
                key={field.id}
                control={form.control}
                name={`participants.${index}.checked`}
                render={({ field: checkField }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-2">
                    <FormLabel>{member?.user.name}</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4">
                        {splitType === 'percentage' && (
                          <FormField
                            control={form.control}
                            name={`participants.${index}.percentage`}
                            render={({ field: percentField }) => (
                              <Input type="number" {...percentField} className="w-24" placeholder="%" disabled={!checkField.value} />
                            )}
                          />
                        )}
                        <Checkbox checked={checkField.value} onCheckedChange={(checked) => checkField.onChange(checked)} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            );
          })}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add Expense'}
        </Button>
      </form>
    </Form>
  );
}

export function AddExpenseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingGroups(true);
      fetch('/api/groups')
        .then(res => res.json())
        .then(data => setGroups(data))
        .catch(() => toast.error('Failed to load groups.'))
        .finally(() => setIsLoadingGroups(false));
    }
  }, [isOpen]);

  const handleGroupSelect = (groupId: string) => {
    if (!groupId) return;
    setIsLoadingMembers(true);
    fetch(`/api/groups/${groupId}`)
      .then(res => res.json())
      .then(data => setSelectedGroup(data))
      .catch(() => toast.error('Failed to load group members.'))
      .finally(() => setIsLoadingMembers(false));
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedGroup(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Expense</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Select onValueChange={handleGroupSelect} disabled={isLoadingGroups || !!selectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingGroups ? 'Loading groups...' : 'Select a group'} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isLoadingMembers && <p>Loading members...</p>}

          {selectedGroup && <AddExpenseForm group={selectedGroup} onFinished={handleClose} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
