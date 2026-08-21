import {
  createContext,
  createSignal,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";

interface SidebarContextType {
  collapsed: Accessor<boolean>;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: () => false,
  setCollapsed: () => {},
});

export function SidebarProvider(props: { children: JSX.Element }) {
  const [collapsed, setCollapsed] = createSignal(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {props.children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
