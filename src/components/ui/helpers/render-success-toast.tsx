import { CheckCircle, CircleCheck } from "lucide-react";

interface Props {
  message?: string;
}
export default function RenderSuccessToast(props: Props) {
  const { message } = props;
  return (
    <div className="w-full flex flex-row items-center justify-center">
      <div className="flex flex-row items-center justify-center w-fit gap-2 bg-popover px-4 py-3 rounded-md shadow">
        <CircleCheck className="fill-success" />
        <p className="text-sm text-success text-center">
          {message ?? "Something went wrong! Try again."}
        </p>
      </div>
    </div>
  );
}
