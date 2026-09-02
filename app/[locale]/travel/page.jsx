import { redirect } from 'next/navigation';

/** /travel has no content of its own — status is what a visitor wants first. */
export default async function TravelIndex({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/travel/status`);
}
