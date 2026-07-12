import { SkeletonList } from "@/components/ui/primitives/skeleton";

// Fallback de streaming des écrans portail (data awaitée). Rendu dans la
// coquille portail déjà présente.
export default function PortailLoading() {
  return (
    <div className="px-6 py-7">
      <div className="mx-auto max-w-portal">
        <SkeletonList count={4} variant="card" />
      </div>
    </div>
  );
}
