import { ElearningModule } from "@/features/elearning/ElearningModule";
import { readInitialCatalog } from '@/lib/initial-catalog';
import { createNonce } from '@mairie360/lib-components/shared';
import { catalogSearch } from '@/features/elearning/catalogQuery';

export default async function Home(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { searchParams } = props ?? {};
  const initialSearch = catalogSearch(await searchParams ?? {});
  return <ElearningModule key={createNonce()} initialState={await readInitialCatalog()} initialSearch={initialSearch} />;
}
