import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Split Expenses, Not Friendships
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          The effortless way to track and settle shared bills with friends and family. Create groups, add expenses, and let us handle the math.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/auth/signin">
          <Button>Get Started</Button>
        </Link>
      </div>
    </section>
  );
}
