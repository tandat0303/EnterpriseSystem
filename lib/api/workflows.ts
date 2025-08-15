import type { Workflow } from "@/types"

const API_BASE_URL = "/api/workflows"

export async function getWorkflows(): Promise<Workflow[]> {
  const response = await fetch(API_BASE_URL)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to fetch workflows")
  }
  return response.json()
}

export async function getWorkflowById(id: string): Promise<Workflow> {
  const response = await fetch(`${API_BASE_URL}/${id}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to fetch workflow")
  }
  return response.json()
}

export async function createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to create workflow")
  }
  return response.json()
}

export async function updateWorkflow(id: string, workflowData: Partial<Workflow>): Promise<Workflow> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to update workflow")
  }
  return response.json()
}

export async function deleteWorkflow(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to delete workflow")
  }
  return response.json()
}
