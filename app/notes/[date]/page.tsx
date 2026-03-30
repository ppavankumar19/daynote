import { redirect } from 'next/navigation';
import { isValidDateISO } from '@/lib/utils/date';
import { todayISO } from '@/lib/utils';
import { DayViewClient } from '@/components/note/day-view-client';
import { formatDisplayDate } from '@/lib/utils';
import type { Metadata } from 'next';

interface PageProps {
  params: { date: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const date = params.date;
  if (!isValidDateISO(date)) return { title: 'DayNote' };
  const formatted = formatDisplayDate(date);
  return { title: `${formatted} — DayNote` };
}

export default function DayPage({ params }: PageProps) {
  const { date } = params;

  if (!isValidDateISO(date)) {
    redirect(`/notes/${todayISO()}`);
  }

  return (
    <main
      className="flex h-screen w-full overflow-hidden"
      aria-label="Main content"
    >
      <DayViewClient date={date} />
    </main>
  );
}
