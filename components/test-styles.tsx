"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export function TestStyles() {
  const { toast } = useToast()

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold">Buttons</h2>
      <div className="flex flex-wrap gap-4">
        <Button>Default Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="destructive">Destructive Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="link">Link Button</Button>
        <Button size="sm">Small Button</Button>
        <Button size="lg">Large Button</Button>
        <Button size="icon">
          <span className="sr-only">Icon</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-plus"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </Button>
      </div>

      <h2 className="text-2xl font-bold">Inputs & Textarea</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="test-input">Test Input</Label>
          <Input id="test-input" placeholder="Enter text here" />
        </div>
        <div>
          <Label htmlFor="test-email">Test Email</Label>
          <Input id="test-email" type="email" placeholder="test@example.com" />
        </div>
        <div>
          <Label htmlFor="test-password">Test Password</Label>
          <Input id="test-password" type="password" placeholder="••••••••" />
        </div>
        <div>
          <Label htmlFor="test-textarea">Test Textarea</Label>
          <Textarea id="test-textarea" placeholder="Enter long text here..." />
        </div>
      </div>

      <h2 className="text-2xl font-bold">Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the content of the card.</p>
          </CardContent>
          <CardFooter>
            <Button>Card Button</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Another Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Just some more content.</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold">Badges</h2>
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      <h2 className="text-2xl font-bold">Avatars</h2>
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-2xl font-bold">Dropdown Menu</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <h2 className="text-2xl font-bold">Toasts</h2>
      <Button
        onClick={() =>
          toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
            action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
          })
        }
      >
        Show Toast
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          })
        }
      >
        Show Destructive Toast
      </Button>

      <h2 className="text-2xl font-bold">Separator</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium">Horizontal Separator</div>
          <Separator className="my-2" />
          <p className="text-sm text-muted-foreground">Content below separator.</p>
        </div>
        <div className="flex h-24 items-center">
          <div className="text-sm font-medium mr-4">Vertical Separator</div>
          <Separator orientation="vertical" />
          <div className="text-sm text-muted-foreground ml-4">Content right of separator.</div>
        </div>
      </div>
    </div>
  )
}
