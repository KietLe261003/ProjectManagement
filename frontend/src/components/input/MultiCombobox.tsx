"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useFrappeGetDocList } from "frappe-react-sdk"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MultiComboboxOption {
  value: string
  label: string
}

interface MultiComboboxProps {
  doctype: string
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  fields?: string[]
  filters?: any[]
  displayField?: string
  valueField?: string
  disabled?: boolean
  limit?: number
  maxSelections?: number
}

export function MultiCombobox({
  doctype,
  value = [],
  onChange,
  placeholder = "Select options...",
  className = "w-[200px]",
  fields = ["name"],
  filters = [],
  displayField = "name",
  valueField = "name",
  disabled = false,
  limit = 20,
  maxSelections,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Build filters for search - simple approach
  const buildFilters = React.useMemo(() => {
    let finalFilters: any = {}
    
    // Add base filters (simple cases only)
    if (filters.length > 0) {
      filters.forEach((filter) => {
        if (Array.isArray(filter) && filter.length >= 3) {
          const [field, operator, filterValue] = filter
          if (operator === "=") {
            finalFilters[field] = filterValue
          }
        }
      })
    }

    // Add search filter if search query exists  
    if (searchQuery.trim()) {
      finalFilters[displayField] = ["like", `%${searchQuery}%`]
    }

    // If no specific filters, just use search
    if (Object.keys(finalFilters).length === 0 && searchQuery.trim()) {
      return [[displayField, "like", `%${searchQuery}%`]]
    }

    // Convert object back to array format for consistent API
    const filterArray: any[] = []
    Object.entries(finalFilters).forEach(([key, filterValue]) => {
      if (Array.isArray(filterValue)) {
        filterArray.push([key, filterValue[0], filterValue[1]])
      } else {
        filterArray.push([key, "=", filterValue])
      }
    })

    return filterArray.length > 0 ? filterArray : undefined
  }, [searchQuery, filters, displayField])

  const { data, isLoading, error } = useFrappeGetDocList(doctype, {
    fields: [...new Set([...fields, displayField, valueField])],
    filters: buildFilters,
    limit,
    orderBy: {
      field: displayField,
      order: "asc"
    }
  })

  const options: MultiComboboxOption[] = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    return data.map((doc: any) => ({
      value: doc[valueField],
      label: doc[displayField]
    }))
  }, [data, displayField, valueField])

  const selectedOptions = options.filter(option => value.includes(option.value))

  const handleSelect = (selectedValue: string) => {
    let newValue: string[]
    
    if (value.includes(selectedValue)) {
      // Remove if already selected
      newValue = value.filter(v => v !== selectedValue)
    } else {
      // Add if not selected and under max limit
      if (maxSelections && value.length >= maxSelections) {
        return // Don't add if at max limit
      }
      newValue = [...value, selectedValue]
    }
    
    onChange(newValue)
  }

  const handleRemove = (valueToRemove: string) => {
    const newValue = value.filter(v => v !== valueToRemove)
    onChange(newValue)
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
  }

  const displayText = React.useMemo(() => {
    if (selectedOptions.length === 0) {
      return placeholder
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0].label
    }
    return `${selectedOptions.length} selected`
  }, [selectedOptions, placeholder])

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
            disabled={disabled}
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", className)}>
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${doctype.toLowerCase()}...`} 
              className="h-9" 
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              {isLoading && (
                <CommandEmpty>Loading...</CommandEmpty>
              )}
              {error && (
                <CommandEmpty>Error loading data.</CommandEmpty>
              )}
              {!isLoading && !error && options.length === 0 && (
                <CommandEmpty>No {doctype.toLowerCase()} found.</CommandEmpty>
              )}
              {!isLoading && !error && options.length > 0 && (
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = value.includes(option.value)
                    const isDisabled = Boolean(maxSelections && value.length >= maxSelections && !isSelected)
                    
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={handleSelect}
                        disabled={isDisabled}
                        className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected items display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                disabled={disabled}
                className="hover:bg-blue-200 rounded-full p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {maxSelections && (
        <div className="text-xs text-gray-500">
          {value.length}/{maxSelections} selected
        </div>
      )}
    </div>
  )
}
