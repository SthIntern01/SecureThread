"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  count?: string;
  active?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-slate-50 dark:bg-brand-black/95 backdrop-blur-sm text-slate-600 dark:text-brand-light shrink-0 border-r border-slate-200 dark:border-brand-gray/20 overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "80px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-slate-50 dark:bg-brand-black/95 backdrop-blur-sm w-full overflow-hidden border-b border-slate-200 dark:border-brand-gray/20"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-slate-800 dark:text-brand-light"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-slate-50 dark:bg-brand-black/95 backdrop-blur-sm text-slate-900 dark:text-brand-light p-10 z-[100] flex flex-col justify-between overflow-hidden",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-slate-800 dark:text-brand-light"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-between gap-2 group/sidebar py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
        link.active 
          ? "bg-[#007AFF] dark:bg-accent text-white shadow-md shadow-blue-500/20 dark:shadow-orange-500/20" 
          : "hover:bg-[#E6F2FF] dark:hover:bg-brand-gray/20 text-slate-600 dark:text-brand-light hover:text-[#007AFF] dark:hover:text-white",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span className={cn(link.active ? "text-white" : "text-slate-400 dark:text-brand-light/70 group-hover/sidebar:text-[#007AFF] dark:group-hover/sidebar:text-accent transition-colors")}>
          {link.icon}
        </span>
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-sm font-semibold whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </div>
      
      {link.count && open && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
            link.active 
              ? "bg-white/20 text-white" 
              : "bg-[#E6F2FF] text-[#007AFF] dark:bg-accent dark:text-white"
          )}
        >
          {link.count}
        </motion.span>
      )}
    </a>
  );
};

export const SidebarSection = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <motion.div
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="px-3 py-2 mt-4"
        >
          <span className="text-[10px] text-slate-400 dark:text-brand-light/40 font-bold uppercase tracking-widest">
            {title}
          </span>
        </motion.div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};
