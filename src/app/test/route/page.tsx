import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function TestPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { groupId } = resolvedParams;
  
  return (
    <div>
      <h1>Test Page</h1>
      <p>Group ID: {groupId}</p>
    </div>
  );
}
