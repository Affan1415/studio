"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import React, { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Icons.barChart },
  { href: "/dashboard/sheets", label: "Connected Sheets", icon: Icons.sheet },
  { href: "/dashboard/prompts", label: "Prompt Templates", icon: Icons.edit3 },
  { href: "/dashboard/activity", label: "Chat Activity", icon: Icons.fileText },
  { href: "/dashboard/settings", label: "Settings", icon: Icons.settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex flex-col items-center group-data-[collapsible=icon]:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 mb-2">
            <Icons.sheet className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold">SheetChat</h1>
          </Link>
        </SidebarHeader>
        <SidebarHeader className="items-center justify-center p-2 hidden group-data-[collapsible=icon]:flex">
          <Link href="/dashboard">
             <Icons.sheet className="h-8 w-8 text-primary" />
          </Link>
        </SidebarHeader>


        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 flex flex-col gap-2">
           <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
           </div>
           <Button variant="ghost" onClick={async () => {
             const { signOut } = await import("@/lib/firebase/auth");
             await signOut();
             router.push('/');
           }} className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0">
            <Icons.logOut />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
          </Button>
          <div className="flex items-center gap-2 mt-2 group-data-[collapsible=icon]:hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName ? user.displayName[0] : user.email ? user.email[0] : 'U'}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium truncate">{user.displayName || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden"/>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{navItems.find(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))?.label || "Dashboard"}</h2>
          </div>
          <div className="hidden md:block">
             <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-0 flex-1 overflow-y-auto">
         {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
