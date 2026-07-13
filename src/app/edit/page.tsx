import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { readGraphData, hasDatabase } from "@/lib/dataStore";
import { Editor } from "@/components/editor/Editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EditPage() {
  // Authoritative auth check (middleware only verifies cookie presence).
  if (!(await isAdmin())) redirect("/login?next=/edit");

  const data = await readGraphData();

  return (
    <>
      {!hasDatabase() ? (
        <div
          role="status"
          className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          No database configured — showing read-only sample data. Set{" "}
          <code>DATABASE_URL</code> to enable saving. Edits will fail until then.
        </div>
      ) : null}
      <Editor data={data} />
    </>
  );
}
