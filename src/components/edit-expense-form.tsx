"use client";

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Prisma, User } from '@prisma/client';

import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';

const expenseWithDetails = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
  include: { payer: true, splits: { include: { user: true } } },
});
type ExpenseWithDetails = Prisma.ExpenseGetPayload<typeof expenseWithDetails>;

const formSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payerId: z.string(),
  splitType: z.enum(['equally', 'percentage']),
  participants: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    checked: z.boolean(),
    percentage: z.coerce.number().optional(),
  })).min(1, 'At least one participant must be selected'),
}).refine(data => {
  if (data.splitType === 'percentage') {
    const totalPercentage = data.participants
      .filter(p => p.checked)
      .reduce((sum, p) => sum + (p.percentage || 0), 0);
    return Math.abs(totalPercentage - 100) < 0.01;
  }
  return true;
}, { message: 'Percentages must add up to 100', path: ['participants'] });

interface EditExpenseFormProps {
  expense: ExpenseWithDetails;
  groupMembers: User[];
  onFinished: () => void;
}

export function EditExpenseForm({ expense, groupMembers, onFinished }: EditExpenseFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expense.description,
      amount: expense.amount,
      payerId: expense.payerId,
      splitType: expense.splits.every(s => s.amount === expense.amount / expense.splits.length) ? 'equally' : 'percentage',
      participants: groupMembers.map(member => {
        const split = expense.splits.find(s => s.userId === member.id);
        return {
          userId: member.id,
          name: member.name || '',
          checked: !!split,
          percentage: split ? (split.amount / expense.amount) * 100 : 0,
        };
      }),
    },
  });

  const { fields, update } = useFieldArray({ control: form.control, name: 'participants' });
  const splitType = form.watch('splitType');

    async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`/api/groups/${expense.groupId}/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast.error('Failed to update expense', { description: errorText });
      } else {
        toast.success('Expense updated successfully!');
        onFinished();
        router.refresh();
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...form.register("description")} />
        {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
        {form.formState.errors.amount && <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>}
      </div>

      <div>
        <Label>Paid by</Label>
        <Controller
          control={form.control}
          name="payerId"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 mt-2">
              {groupMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={member.id} id={`payer-${member.id}`} />
                  <Label htmlFor={`payer-${member.id}`}>{member.name}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label>Split Method</Label>
        <Controller
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equally" id="edit-equally" />
                <Label htmlFor="edit-equally">Equally</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="edit-percentage" />
                <Label htmlFor="edit-percentage">By Percentage</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label>Split Between</Label>
        <div className="space-y-2 mt-2 border rounded-md p-4 max-h-60 overflow-y-auto">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name={`participants.${index}.checked`}
                  render={({ field: checkboxField }) => (
                    <Checkbox
                      checked={checkboxField.value}
                      onCheckedChange={checkboxField.onChange}
                    />
                  )}
                />
                <Label>{field.name}</Label>
              </div>
              {splitType === 'percentage' && form.watch(`participants.${index}.checked`) && (
                <div className="flex items-center gap-2 w-24">
                  <Input type="number" placeholder="%" {...form.register(`participants.${index}.percentage`)} />
                </div>
              )}
            </div>
          ))}
        </div>
        {form.formState.errors.participants && <p className="text-sm text-red-500 mt-1">{form.formState.errors.participants.message}</p>}
      </div>

      <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
      </div>
    </form>
  );
}
