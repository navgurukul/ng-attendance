// import * as React from "react";

// import { cn } from "@/lib/utils";

// export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
//   return (
//     <textarea
//       className={cn(
//         "flex min-h-[80px] w-full border-[3px] border-foreground bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50",
//         className,
//       )}
//       ref={ref}
//       {...props}
//     />
//   );
// });
// Textarea.displayName = "Textarea";

// export { Textarea };

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          `flex min-h-[80px] w-full
           border-[2px] border-[#111]
           bg-background px-3 py-2 text-sm
           placeholder:text-muted-foreground
           focus-visible:outline-[2px] focus-visible:outline-[#111]
           disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
