'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { MainNavItem } from "@/types"
import { cn } from "@/lib/utils"

interface MainNavProps {
  items: MainNavItem[]
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex gap-6">
      {items?.map((item, index) => (
        <Link
          key={index}
          href={item.disabled ? "#" : item.href}
          className={cn(
            "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
            pathname === item.href ? "text-foreground" : "text-foreground/60",
            item.disabled && "cursor-not-allowed opacity-80"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
