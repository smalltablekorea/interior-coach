"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceRole } from "@/lib/workspace/permissions";

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  myRole: WorkspaceRole;
}

interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  plan: string;
  inviteCode: string;
  isActive: boolean;
}

interface WorkspaceContextType {
  workspace: WorkspaceInfo | null;
  workspaces: WorkspaceListItem[];
  loading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refresh: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  workspaces: [],
  loading: true,
  switchWorkspace: async () => {},
  refresh: () => {},
});

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/`;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/current");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setCookie("has_workspace", "1", 365);
      } else {
        setWorkspace(null);
        setCookie("has_workspace", "", -1);
        // 워크스페이스 없으면 설정 페이지로
        router.push("/workspace/setup");
      }
    } catch {
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (!res.ok) return;
      const data = await res.json();
      setWorkspaceList(data.workspaces || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
    fetchList();
  }, [fetchCurrent, fetchList]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        const res = await fetch("/api/workspace/current", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (res.ok) {
          await fetchCurrent();
          await fetchList();
          router.refresh();
        }
      } catch {
        // ignore
      }
    },
    [fetchCurrent, fetchList, router],
  );

  const refresh = useCallback(() => {
    fetchCurrent();
    fetchList();
  }, [fetchCurrent, fetchList]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaces: workspaceList,
        loading,
        switchWorkspace,
        refresh,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
