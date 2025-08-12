"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useSearch, useFrappeGetDocList } from "frappe-react-sdk"

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

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  doctype: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  fields?: string[]
  filters?: any[]
  displayField?: string
  valueField?: string
  disabled?: boolean
  limit?: number
}

export function Combobox({
  doctype,
  value = "",
  onChange,
  placeholder = "Select option...",
  className = "w-[200px]",
  fields = ["name"],
  filters = [],
  displayField = "name",
  valueField = "name",
  disabled = false,
  limit = 20,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Sử dụng useSearch cho search functionality
  const { 
    data: searchData, 
    isLoading: isSearching, 
    error: searchError 
  } = useSearch(
    doctype,
    searchQuery,
    filters
  )

  // Fallback: Load initial data khi không có search
  const { 
    data: initialData, 
    isLoading: isLoadingInitial, 
    error: initialError 
  } = useFrappeGetDocList(
    doctype,
    {
      fields: [...new Set([...fields, displayField, valueField])],
      filters,
      limit,
      orderBy: {
        field: displayField,
        order: "asc"
      }
    },
    searchQuery ? undefined : doctype // Chỉ load khi không search
  )

  const options: ComboboxOption[] = React.useMemo(() => {
    let dataToUse: any[] = []
    
    if (searchQuery && searchData) {
      // useSearch trả về format khác, có thể là { message: SearchResult[] }
      dataToUse = Array.isArray(searchData) ? searchData : searchData.message || []
    } else if (!searchQuery && initialData) {
      dataToUse = initialData
    }
    
    return dataToUse.map((doc: any) => ({
      value: doc[valueField],
      label: doc[displayField]
    }))
  }, [searchData, initialData, searchQuery, displayField, valueField])

  const selectedOption = options.find(option => option.value === value)
  const isLoading = searchQuery ? isSearching : isLoadingInitial
  const error = searchQuery ? searchError : initialError

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue
    onChange(newValue)
    setOpen(false)
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedOption?.label || placeholder}
          <ChevronsUpDown className="opacity-50" />
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
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Backwards compatibility - keep the demo for reference
export function ComboboxDemo() {
  const [value, setValue] = React.useState("")

  const frameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
  ]

  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select framework..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {framework.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
