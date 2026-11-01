/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'

const Workspace = createContext(null)

// Workspace data is intentionally local until dashboard APIs are added.
export function WorkspaceProvider({ children }) {
  const value = {
    projects: [],
    builds: [],
    data: [],
    loading: false,
    error: '',
    buildsLoading: false,
    buildsError: '',
    reload: () => {},
    reloadBuilds: () => {},
    updateData: () => {},
  }

  return <Workspace.Provider value={value}>{children}</Workspace.Provider>
}

export const useWorkspace = () => useContext(Workspace)
