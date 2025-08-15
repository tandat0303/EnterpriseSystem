"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import { Controller, FormProvider, useFormContext, type FieldPath, type FieldValues } from "react-hook-form"

import { cn } from "@/lib/utils"

const Form = FormProvider

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: React.PropsWithChildren<Controller<TFieldValues, TName>>,
) => {
  return (
    <Controller
      {...props}
      render={({ field, fieldState, formState }) => {
        return props.render({ ...field, fieldState, formState })
      }}
    />
  )
}

const useFormField = () => {
  const fieldContext = useFormContext()
  const itemContext = React.useContext(FormItemContext)
  const { name } = itemContext

  if (!name) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { formState, ...rest } = fieldContext

  return {
    name,
    formItemContext: itemContext,
    formDescriptionId: `${name}-form-item-description`,
    formMessageId: `${name}-form-item-message`,
    ...formState,
    ...rest,
  }
}

type FormItemContextValue = {
  id: string
  name: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    const { name } = useFormField()

    return (
      <FormItemContext.Provider value={{ id, name }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    )
  },
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemContext } = useFormField()

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemContext.id}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { formItemContext, formDescriptionId, formMessageId } = useFormField()

    return (
      <Slot
        ref={ref}
        id={formItemContext.id}
        aria-describedby={!formItemContext.id ? undefined : `${formDescriptionId} ${formMessageId}`}
        {...props}
      />
    )
  },
)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField()

    return (
      <p ref={ref} id={formDescriptionId} className={cn("text-[0.8rem] text-muted-foreground", className)} {...props} />
    )
  },
)
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error?.message) : children

    if (!body) {
      return null
    }

    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn("text-[0.8rem] font-medium text-destructive", className)}
        {...props}
      >
        {body}
      </p>
    )
  },
)
FormMessage.displayName = "FormMessage"

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
