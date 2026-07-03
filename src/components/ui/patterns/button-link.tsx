import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "../primitives/button";

type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type AnchorButtonProps = React.ComponentProps<"a"> & VariantProps<typeof buttonVariants>;

export function AnchorButton({ className, variant, size, ...props }: AnchorButtonProps) {
  return <a className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
