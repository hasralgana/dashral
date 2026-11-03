"use client"

import * as React from "react"

import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type TextareaProps = React.ComponentProps<"textarea"> &
  FieldOwnProps & {
    classNames?: FieldClassNames & { textarea?: string }
  }

/** A text area that grows with what's typed. Give it a label, description or error and it becomes a whole field. */
function Textarea(props: TextareaProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <TextareaControl {...control} />
    </FieldWrapper>
  )
}

function TextareaControl({ className, classNames, ...rest }: Omit<TextareaProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 md:text-sm [&[readonly]]:bg-muted/50 [&[readonly]]:text-muted-foreground",
        className,
        classNames?.textarea
      )}
      {...props}
    />
  )
}

export { Textarea, type TextareaProps }
