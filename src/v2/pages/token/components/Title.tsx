import { colors } from "@/constants";
import React from "react";

function Title({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2 mx-2">
      <div className="flex items-center gap-2">
        <p
          className="text-xl font-semibold"
          style={{
            color: colors.textprimary,
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

export default Title;
