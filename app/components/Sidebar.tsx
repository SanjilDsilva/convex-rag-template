import Link from "next/link";

export default function Sidebar({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="w-56 bg-gray-900 text-white flex flex-col p-4 h-full">
      <Link href="/workspaces" className="mb-6 text-lg font-bold hover:underline">
        Workspaces
      </Link>
      <div className="flex-1" />
    </div>
  );
}
