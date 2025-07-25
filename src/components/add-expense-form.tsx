"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import type { Group, User } from "@prisma/client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  payerId: z.string({ required_error: "You must select who paid." }),
  splitType: z.enum(["equally", "percentage"]),
  participants: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    checked: z.boolean(),
    percentage: z.coerce.number().min(0).optional(),
  })).min(1, "At least one participant must be selected.")
}).refine(data => {
  if (data.splitType === 'percentage') {
    const total = data.participants
      .filter(p => p.checked)
      .reduce((sum, p) => sum + (p.percentage || 0), 0);
    return Math.abs(total - 100) < 0.01; // Allow for small floating point inaccuracies
  }
  return true;
}, { message: "Percentages must add up to 100.", path: ["participants"] });

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface AddExpenseFormProps {
  group: Group & { members: { user: User }[] };
  currentUser: User;
}

export function AddExpenseForm({ group, currentUser }: AddExpenseFormProps) {
  const router = useRouter();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      payerId: currentUser.id,
      splitType: "equally",
      participants: group.members.map(member => ({
        userId: member.user.id,
        name: member.user.name || member.user.email || "Unknown User",
        checked: true,
        percentage: 0,
      })),
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "participants" });
  const splitType = form.watch("splitType");

  const onSubmit = async (data: ExpenseFormValues) => {
    const participants = data.participants.filter(p => p.checked);
    if (participants.length === 0) {
      toast.error("You must select at least one person to split with.");
      return;
    }

    try {
      const response = await fetch(`/api/groups/${group.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          splitMethod: data.splitType, // Ensure correct field name is sent
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast.error("Failed to add expense", { description: errorText });
      } else {
        toast.success("Expense added successfully!");
        router.push(`/dashboard/groups/${group.id}`);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {group.members.map(member => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.payerId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.payerId.message}</p>}
      </div>

      <div>
        <Label>Split Method</Label>
        <Controller
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equally" id="equally" />
                <Label htmlFor="equally">Equally</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">By Percentage</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label>Split Between</Label>
        <div className="space-y-2 mt-2 border rounded-md p-4">
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

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Adding..." : "Add Expense"}
      </Button>
    </form>
  );
}
