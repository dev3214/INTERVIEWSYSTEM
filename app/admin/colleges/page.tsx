"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, MoreVertical, Loader2, Building2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import toast from "react-hot-toast"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

type College = {
  id: string
  name: string
  slug: string
  emailDomain: string
  domains: string[]
  status: string
  createdAt: string
  updatedAt: string
}

type Domain = {
  id: string
  name: string
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [allDomains, setAllDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    emailDomain: "",
    domains: [] as string[]
  })
  const [isDomainPopoverOpen, setIsDomainPopoverOpen] = useState(false)
  const [showAllDomains, setShowAllDomains] = useState<{ [collegeId: string]: boolean }>({})
  const [domainPopoverOpen, setDomainPopoverOpen] = useState<{ [collegeId: string]: boolean }>({})

  // Fetch colleges from API
  const fetchColleges = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/colleges")
      if (!response.ok) {
        throw new Error("Failed to fetch colleges")
      }
      const data = await response.json()
      setColleges(data.colleges)
      setError(null)
    } catch (err) {
      console.error("Error fetching colleges:", err)
      setError(err instanceof Error ? err.message : String(err))
      toast("Failed to load colleges. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch all domains for selection
  const fetchDomains = async () => {
    try {
      const response = await fetch("/api/domains")
      if (!response.ok) {
        throw new Error("Failed to fetch domains")
      }
      const data = await response.json()
      const formattedDomains = data.domains.map((domain: any) => ({
        id: String(domain._id),
        name: domain.domainname
      }))
      setAllDomains(formattedDomains)
    } catch (err) {
      console.error("Error fetching domains:", err)
      toast("Failed to load domains. Please try again.")
    }
  }

  useEffect(() => {
    fetchColleges()
    fetchDomains()
  }, [])

  const filteredColleges = colleges
    .filter((college) => {
      const matchesSearch =
        (college.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (college.emailDomain?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (college.slug?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))

  const handleAddCollege = () => {
    setFormData({
      name: "",
      slug: "",
      emailDomain: "",
      domains: []
    })
    setIsAddDialogOpen(true)
  }

  const handleEditCollege = (college: College) => {
    setSelectedCollege(college)
    
    // Map domain names back to domain IDs for the form
    const domainIds = college.domains
      .map(domainName => allDomains.find(domain => domain.name === domainName)?.id)
      .filter(Boolean) as string[]
    
    setFormData({
      name: college.name,
      slug: college.slug,
      emailDomain: college.emailDomain,
      domains: domainIds
    })
    setIsEditDialogOpen(true)
  }

  const handleDomainToggle = (domainId: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domainId)
        ? prev.domains.filter(id => id !== domainId)
        : [...prev.domains, domainId]
    }))
  }

  const getSelectedDomainNames = () => {
    return formData.domains
      .map(id => allDomains.find(domain => domain.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const toggleShowAllDomains = (collegeId: string) => {
    setShowAllDomains(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }))
  }

  const toggleDomainPopover = (collegeId: string) => {
    setDomainPopoverOpen(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }))
  }

  const handleDeleteCollege = async (collegeId: string) => {
    if (!confirm("Are you sure you want to delete this college? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/colleges?id=${collegeId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete college")
      }

      toast.success("College deleted successfully")
      fetchColleges()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete college")
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.slug || !formData.emailDomain || formData.domains.length === 0) {
        toast.error("Please fill in all required fields and select at least one domain")
        return
      }

      const response = await fetch("/api/admin/colleges", {
        method: isEditDialogOpen ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...(isEditDialogOpen && { id: selectedCollege?.id })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save college")
      }
      
      toast.success(isEditDialogOpen ? "College updated successfully" : "College added successfully")
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      setSelectedCollege(null)
      fetchColleges()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save college")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Colleges</h2>
            <p className="text-muted-foreground">Manage college partnerships and configurations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading colleges...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Colleges</h2>
            <p className="text-muted-foreground">Manage college partnerships and configurations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6 h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Colleges</h2>
          <p className="text-muted-foreground">Manage college partnerships and configurations</p>
        </div>
        <Button onClick={handleAddCollege} className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Add College
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search colleges by name, email domain, or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College</TableHead>
              <TableHead>Email Domain</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Domains</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColleges.map((college) => (
              <TableRow key={college.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-logo.png" alt={college.name} />
                      <AvatarFallback>
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{college.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {college.domains.length} domains configured
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    @{college.emailDomain}
                  </code>
                </TableCell>
                                 <TableCell>
                   <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                     localhost:3000/login/{college.slug}
                   </code>
                 </TableCell>
                                 <TableCell>
                   <div className="flex flex-wrap gap-1">
                     {college.domains.slice(0, 2).map((domain) => (
                       <Badge key={domain} variant="secondary" className="text-xs">
                         {domain}
                       </Badge>
                     ))}
                     {college.domains.length > 2 && (
                       <Popover open={domainPopoverOpen[college.id]} onOpenChange={(open) => toggleDomainPopover(college.id)}>
                         <PopoverTrigger asChild>
                           <Badge 
                             variant="outline" 
                             className="text-xs cursor-pointer hover:bg-gray-200"
                           >
                             +{college.domains.length - 2} more
                           </Badge>
                         </PopoverTrigger>
                         <PopoverContent className="w-64 p-3" align="start">
                           <div className="space-y-2">
                             <h4 className="font-medium text-sm">All Domains for {college.name}</h4>
                             <div className="flex flex-wrap gap-1">
                               {college.domains.map((domain) => (
                                 <Badge key={domain} variant="secondary" className="text-xs">
                                   {domain}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         </PopoverContent>
                       </Popover>
                     )}
                   </div>
                 </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCollege(college)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteCollege(college.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredColleges.length === 0 && !loading && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">No colleges found matching your criteria.</p>
          <Button onClick={handleAddCollege} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First College
          </Button>
        </div>
      )}

      {/* Add/Edit College Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedCollege(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit College" : "Add New College"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Update college information and configuration."
                : "Add a new college partnership with custom domain access."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">College Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter college name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="college-slug"
              />
              <p className="text-xs text-muted-foreground">
                This will create the URL: localhost:3000/login/{formData.slug || "college-slug"}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailDomain">Email Domain</Label>
              <Input
                id="emailDomain"
                value={formData.emailDomain}
                onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                placeholder="college.ac.in"
              />
              <p className="text-xs text-muted-foreground">
                Only students with @{formData.emailDomain || "college.ac.in"} emails can access this portal
              </p>
            </div>
            
                         <div className="grid gap-2">
               <Label>Available Domains</Label>
               <div className="text-sm text-muted-foreground mb-2">
                 Select the domains that will be available to students from this college
               </div>
               <Popover open={isDomainPopoverOpen} onOpenChange={setIsDomainPopoverOpen}>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     role="combobox"
                     aria-expanded={isDomainPopoverOpen}
                     className="w-full justify-between"
                   >
                     {formData.domains.length > 0 
                       ? `${formData.domains.length} domain(s) selected`
                       : "Select domains..."
                     }
                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-full p-0" align="start">
                   <Command>
                     <CommandInput placeholder="Search domains..." />
                     <CommandList>
                       <CommandEmpty>No domains found.</CommandEmpty>
                       <CommandGroup>
                         <ScrollArea className="h-64">
                           {allDomains.map((domain) => (
                             <CommandItem
                               key={domain.id}
                               onSelect={() => handleDomainToggle(domain.id)}
                               className="flex items-center space-x-2"
                             >
                               <Checkbox
                                 checked={formData.domains.includes(domain.id)}
                                 className="mr-2"
                               />
                               <span>{domain.name}</span>
                             </CommandItem>
                           ))}
                         </ScrollArea>
                       </CommandGroup>
                     </CommandList>
                   </Command>
                 </PopoverContent>
               </Popover>
               {formData.domains.length > 0 && (
                 <div className="mt-2">
                   <p className="text-xs text-green-600 mb-1">
                     Selected: {formData.domains.length} domain(s)
                   </p>
                   <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                     {getSelectedDomainNames()}
                   </div>
                 </div>
               )}
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setIsEditDialogOpen(false)
              setSelectedCollege(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditDialogOpen ? "Update College" : "Add College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
