import { SkeletonList } from "@/components/ui/primitives/skeleton";

export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <SkeletonList count={3} variant="card" />
    </div>
  );
}
