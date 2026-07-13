import { readGraphData } from "@/lib/dataStore";
import { Viewer } from "@/components/Viewer";

// Always read fresh data so edits show up after router.refresh().
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await readGraphData();
  return <Viewer data={data} />;
}
