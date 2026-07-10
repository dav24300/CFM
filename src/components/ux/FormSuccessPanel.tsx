import Link from "next/link";
import { Alert } from "@/components/ui/primitives/alert";

type Props = {
  acknowledgment: string;
  delay: string;
  nextLabel: string;
  nextHref?: string;
};

export function FormSuccessPanel({ acknowledgment, delay, nextLabel, nextHref }: Props) {
  return (
    <Alert variant="success" className="space-y-2">
      <p className="font-medium">{acknowledgment}</p>
      <p className="text-sm">{delay}</p>
      <p className="text-sm">
        {nextHref ? (
          <>
            <Link href={nextHref} className="font-semibold underline">
              {nextLabel}
            </Link>
          </>
        ) : (
          nextLabel
        )}
      </p>
    </Alert>
  );
}
