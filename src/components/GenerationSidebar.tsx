import { ChatMessage } from "@/components/ChatThread";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Image } from "lucide-react";

interface GenerationSidebarProps {
  messages: ChatMessage[];
}

export default function GenerationSidebar({ messages }: GenerationSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const completedImages = messages.filter(
    (m) => m.role === "assistant" && m.imageUrl && !m.isGenerating
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Recent
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {completedImages.length === 0 ? (
                <SidebarMenuItem>
                  <div className={`flex items-center gap-2 px-2 py-3 ${collapsed ? "justify-center" : ""}`}>
                    <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                    {!collapsed && (
                      <span className="text-xs text-muted-foreground">No images yet</span>
                    )}
                  </div>
                </SidebarMenuItem>
              ) : (
                completedImages.map((msg) => (
                  <SidebarMenuItem key={msg.id}>
                    <SidebarMenuButton className="h-auto py-1.5 px-2">
                      <div className={`flex items-center gap-2.5 w-full ${collapsed ? "justify-center" : ""}`}>
                        <img
                          src={msg.imageUrl}
                          alt={msg.prompt}
                          className="h-8 w-8 rounded object-cover shrink-0 border border-border/40"
                        />
                        {!collapsed && (
                          <span className="text-[11px] text-muted-foreground truncate font-mono leading-tight">
                            {msg.prompt}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
