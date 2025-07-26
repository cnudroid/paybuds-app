import { getCurrentUser } from "../../../../../../lib/session";
import { db } from "../../../../../../lib/db";
import { z } from "zod";

const expenseUpdateSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  payerId: z.string(),
  splitType: z.enum(["equally", "percentage"]),
  participants: z.array(z.object({
    userId: z.string(),
    checked: z.boolean(),
    percentage: z.number().min(0).optional(),
  })).min(1)
}).refine((data) => {
  if (data.splitType === 'percentage') {
    const selected = data.participants.filter(p => p.checked);
    if (selected.length === 0) return true;
    const total = selected.reduce((sum, p) => sum + (p.percentage || 0), 0);
    return Math.abs(total - 100) < 0.01;
  }
  return true;
}, {
  message: "Percentages for selected members must add up to 100.",
  path: ["participants"],
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const params = await context.params;
    const { groupId, expenseId } = params;
    const group = await db.group.findFirst({
      where: { id: groupId, members: { some: { userId: user.id } } },
      include: { members: true },
    });

    if (!group) {
      return new Response("Group not found or you are not a member", { status: 404 });
    }

    const json = await req.json();
    const body = expenseUpdateSchema.parse(json);

    const selectedParticipants = body.participants.filter(p => p.checked);
    if (selectedParticipants.length === 0) {
      return new Response("At least one participant must be selected", { status: 400 });
    }

    const groupMemberIds = new Set(group.members.map(m => m.userId));
    if (!selectedParticipants.every(p => groupMemberIds.has(p.userId)) || !groupMemberIds.has(body.payerId)) {
      return new Response("Invalid participant or payer selected", { status: 400 });
    }

    let splitsToCreate: { userId: string; amount: number }[] = [];

    if (body.splitType === 'equally') {
      const amountPerPerson = body.amount / selectedParticipants.length;
      splitsToCreate = selectedParticipants.map(p => ({
        userId: p.userId,
        amount: parseFloat(amountPerPerson.toFixed(2)),
      }));
    } else {
      splitsToCreate = selectedParticipants.map(p => ({
        userId: p.userId,
        amount: parseFloat(((body.amount * (p.percentage || 0)) / 100).toFixed(2)),
      }));
    }

    const totalSplit = splitsToCreate.reduce((sum, s) => sum + s.amount, 0);
    const remainder = parseFloat((body.amount - totalSplit).toFixed(2));
    if (remainder !== 0) {
      splitsToCreate[0].amount += remainder;
    }

    const updatedExpense = await db.$transaction(async (prisma) => {
      await prisma.expenseSplit.deleteMany({
        where: { expenseId: expenseId },
      });

      const expense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          description: body.description,
          amount: body.amount,
          payerId: body.payerId,
          splits: {
            create: splitsToCreate,
          },
        },
        include: {
          splits: true,
        },
      });

      return expense;
    });

    return new Response(JSON.stringify(updatedExpense), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
