import { accessToken } from "../lib/supabase";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export type Project = { id:string; name:string; analysis:any; generated_code:string; current_code:string; design_settings:any; created_at:string; updated_at:string; reference_image_path?:string };
export type Version = { id:string; version_number:number; code:string; created_at:string };
async function request(path:string, options:RequestInit={}) { const token=await accessToken(); const response=await fetch(`${API_URL}/api/projects${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}}); const data=await response.json().catch(()=>null); if(!response.ok||!data?.success)throw new Error(data?.message||"Project request failed."); return data; }
export const listProjects=async()=> (await request("/")).projects as Project[];
export const getProject=async(id:string)=> (await request(`/${id}`)).project as Project;
export const deleteProject=async(id:string)=>request(`/${id}`,{method:"DELETE"});
export const versions=async(id:string)=> (await request(`/${id}/versions`)).versions as Version[];
export const restoreVersion=async(id:string,versionId:string)=> (await request(`/${id}/versions/${versionId}/restore`,{method:"POST"})).project as Project;
export async function saveProject(project:Partial<Project>&{name:string;code:string;generatedCode:string;image?:File|null;designSettings?:unknown;analysis?:unknown}, id?:string) { const form=new FormData(); Object.entries(project).forEach(([key,value])=>{if(value===undefined||value===null)return;if(key==="image")form.append("image",value as File);else if(typeof value==="object")form.append(key,JSON.stringify(value));else form.append(key,String(value));}); return (await request(id?`/${id}`:"/",{method:id?"PATCH":"POST",body:form})).project as Project; }

