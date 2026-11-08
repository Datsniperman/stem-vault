import { redirect } from 'next/navigation';

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const reason = typeof searchParams?.reason === 'string' ? searchParams.reason : 'unauthorized';
  redirect(`/membership?reason=${encodeURIComponent(reason)}`);
}
