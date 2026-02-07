import { redirect } from 'next/navigation';

export default function LegacyBlockLibraryRedirectPage() {
  redirect('/library');
}
