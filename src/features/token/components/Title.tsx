import { cn } from "@/lib/utils";

function Title({
  title,
  ctrClassName,
}: {
  title: string;
  ctrClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 mt-4 mb-2 mx-2", ctrClassName)}>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text-subtle">{title}</p>
      </div>
    </div>
  );
}

export default Title;
