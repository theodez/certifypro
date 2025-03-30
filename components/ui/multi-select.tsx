// components/ui/multi-select.tsx
'use client'

import Select from 'react-select'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

export type MultiSelectOption = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: MultiSelectOption[]
  onChange: (value: MultiSelectOption[]) => void
  placeholder?: string
  className?: string
  isClearable?: boolean
  isSearchable?: boolean
  isDisabled?: boolean
}

const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  className,
  isClearable = true,
  isSearchable = true,
  isDisabled = false,
}: MultiSelectProps) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => onChange(newValue as MultiSelectOption[])}
      placeholder={placeholder}
      isMulti
      isClearable={isClearable}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      unstyled
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      noOptionsMessage={() => 'Aucun résultat trouvé'}
      className={cn('text-sm', className)}
      components={{
        DropdownIndicator: ({ innerProps }) => (
          <div {...innerProps}>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        ),
        ClearIndicator: ({ innerProps }) => (
          <div {...innerProps}>
            <X className="h-4 w-4 opacity-50 hover:opacity-100" />
          </div>
        ),
        MultiValueRemove: ({ innerProps }) => (
          <div {...innerProps}>
            <X className="h-3 w-3 ml-1 hover:text-destructive" />
          </div>
        ),
      }}
      classNames={{
        control: ({ isFocused }) =>
          cn(
            'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            isFocused ? 'ring-2 ring-ring ring-offset-2' : '',
            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          ),
        menu: () => 'mt-1 rounded-md border bg-popover shadow-lg',
        option: ({ isFocused, isSelected }) =>
          cn(
            'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors',
            isFocused && 'bg-accent text-accent-foreground',
            isSelected && 'bg-primary/10 text-primary-foreground'
          ),
        multiValue: () =>
          'flex items-center gap-1 bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm mr-1',
        input: () => 'text-foreground',
        placeholder: () => 'text-muted-foreground',
      }}
    />
  )
}

export { MultiSelect }