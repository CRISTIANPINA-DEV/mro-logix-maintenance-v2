"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
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

interface User {
  id: string
  fullName: string
  username: string
  email: string
}

interface UserSearchComboboxProps {
  value?: string
  onValueChange: (value: string, fullName: string) => void
  className?: string
}

export function UserSearchCombobox({
  value,
  onValueChange,
  className
}: UserSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [totalFound, setTotalFound] = React.useState<number>(0)
  const [lastSearch, setLastSearch] = React.useState<string>("")
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Minimum search length
  const MIN_SEARCH_LENGTH = 2

  // Fetch users when search query changes
  React.useEffect(() => {
    const fetchUsers = async () => {
      // Clear error state
      setError(null)

      // Don't search if query is too short
      if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) {
        setUsers([])
        setTotalFound(0)
        return
      }

      // Don't search if it's the same as last search
      if (searchQuery === lastSearch) {
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        if (data.users) {
          setUsers(data.users)
          setTotalFound(data.totalFound || data.users.length)
          setLastSearch(searchQuery)
          
          // If we have a value, find and set the selected user
          if (value) {
            const user = data.users.find((u: User) => u.id === value)
            if (user) {
              setSelectedUser(user)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to search users. Please try again.')
        setUsers([])
        setTotalFound(0)
      } finally {
        setLoading(false)
      }
    }

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set a new timeout
    searchTimeoutRef.current = setTimeout(fetchUsers, 300)

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, value, lastSearch])

  // Clear search when popover closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery("")
      setError(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedUser ? (
            <span className="truncate">{selectedUser.fullName}</span>
          ) : (
            <span className="text-muted-foreground">Search and select inspector...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder={`Search by name, username, or email (min. ${MIN_SEARCH_LENGTH} chars)...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Searching...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm py-4 px-2 text-center">{error}</div>
              ) : searchQuery.length < MIN_SEARCH_LENGTH ? (
                <div className="text-muted-foreground text-sm py-4 px-2 text-center">
                  Enter at least {MIN_SEARCH_LENGTH} characters to search
                </div>
              ) : (
                <div className="text-muted-foreground text-sm py-4 px-2 text-center">
                  No users found. Try a different search term.
                </div>
              )}
            </CommandEmpty>
            {users.length > 0 && (
              <CommandGroup heading={`Found ${totalFound} user${totalFound === 1 ? '' : 's'}`}>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      setSelectedUser(user)
                      onValueChange(user.id, user.fullName)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 px-2 py-3"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{user.fullName}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{user.username}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </div>
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