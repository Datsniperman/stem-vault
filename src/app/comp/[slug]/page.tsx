import { redirect } from 'next/navigation';

export default async function CompRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/competitions/${encodeURIComponent(slug)}`);
}
