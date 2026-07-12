import { SkeletonList } from "@/components/ui/primitives/skeleton";

export default function LiveLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <SkeletonList count={2} variant="card" />
    </div>
  );
}
