import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import PublicProfileClient from './PublicProfileClient';

type Props = {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const messages = await getMessages();
  
  const userMessages = {
    Profile: messages.Profile,
  };

  return (
    <NextIntlClientProvider messages={userMessages}>
      <PublicProfileClient userId={resolvedParams.id} />
    </NextIntlClientProvider>
  );
}
