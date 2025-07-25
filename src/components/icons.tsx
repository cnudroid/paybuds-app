import { User, Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type Icon = LucideIcon

const Google = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        className={cn("h-4 w-4", className)}
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
        {...props}
    >
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.5 109.8 8.5 244 8.5c71.8 0 129.4 28.1 176.1 72.9l-63.1 61.9c-34.4-32.5-79.6-51.9-129.4-51.9-106 0-191.2 85.8-191.2 191.2s85.2 191.2 191.2 191.2c62.3 0 102-26.1 132.3-54.8 24.6-22.5 38.8-55.9 42.9-97.3H244V261.8h244z"></path>
    </svg>
)

export const Icons = {
  user: User,
  spinner: Loader2,
  google: Google,
}
