"use client";
import { useEffect, useRef } from "react";
import type { LodgeContent } from "./content";
type Tool = {name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context = {registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useSiteTools(content:LodgeContent,canEdit:boolean,openEditor:()=>void) {
  const current=useRef({content,canEdit,openEditor});current.current={content,canEdit,openEditor};
  useEffect(()=>{
    const context=(document as unknown as {modelContext?:Context}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const schema={type:"object",properties:{},additionalProperties:false};
    const validate=(input:unknown)=>{if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length)throw new Error("Expected an empty object.");};
    const list:Tool[]=[
      {name:"read_lodge_content",title:"Ανάγνωση στοιχείων Στοάς",description:"Read the currently displayed lodge identity, officers, meetings and past masters. Does not change data.",inputSchema:schema,annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){validate(input);return structuredClone(current.current.content);}},
      {name:"start_lodge_editing",title:"Άνοιγμα επεξεργασίας",description:"Open the lodge editor for the signed-in administrator. This only opens the editor; it does not save or change any lodge records.",inputSchema:schema,annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){validate(input);if(!current.current.canEdit)throw new Error("Administrator sign-in required.");current.current.openEditor();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));return {editor:"open",saved:false};}},
    ];
    for(const tool of list){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
    return ()=>lifecycle.abort();
  },[]);
}
