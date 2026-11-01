/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'

const Workspace = createContext(null)

// Keep projects created during the current app session visible in the workspace.
export function WorkspaceProvider({ children }) {
  const [projects, setProjects] = useState([])
  const addProject = useCallback((project) => {
    if (!project) return
    setProjects((current) => [project, ...current.filter((item) => item._id !== project._id)])
  }, [])
  const value = {
    projects,
    builds: [],
    data: [],
    loading: false,
    error: '',
    buildsLoading: false,
    buildsError: '',
    reload: () => {},
    reloadBuilds: () => {},
    updateData: () => {},
    addProject,
  }

  return <Workspace.Provider value={value}>{children}</Workspace.Provider>
}

export const useWorkspace = () => useContext(Workspace)
