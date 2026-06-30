import Image from "next/image";
import { cn } from "@/lib/utils";
import { COMPANY_LOGO_ALT, COMPANY_LOGO_SRC } from "@/lib/storefront-brand";

interface CompanyLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function CompanyLogo({
  size = 32,
  className,
  priority = false,
}: CompanyLogoProps) {
  return (
    <Image
      src={COMPANY_LOGO_SRC}
      alt={COMPANY_LOGO_ALT}
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain shrink-0", className)}
    />
  );
}
