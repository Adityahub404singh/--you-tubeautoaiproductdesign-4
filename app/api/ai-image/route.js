import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
const TOKEN = process.env.REPLICATE_API_TOKEN
const STYLES = {
  facts:"indian scientist shocked, cinematic blue neon 4K, science lab dark",
  motivation:"young indian athlete determined, golden hour epic 4K, mountain sunrise",
  tech:"indian tech person excited, cyberpunk neon blue 4K, holographic displays",
  story:"indian person emotional, dark film noir 4K, mysterious foggy",
  horror:"scared indian person pale, horror dark red 4K, haunted darkness",
  shorts:"young indian creator energetic, vibrant colorful 4K, urban neon",
  finance:"indian businessman confident, professional gold 4K, financial charts",
  health:"healthy indian person peaceful, warm natural 4K, yoga nature",
  general:"indian person expressive, cinematic warm 4K, beautiful India sky",
}
export async function POST(req) {
  try {
    if(!TOKEN) return NextResponse.json({error:"REPLICATE_API_TOKEN not set"},{status:500})
    const {sceneText,category="general",isShorts=true,sceneIndex=0,totalScenes=1,videoId}=await req.json()
    if(!sceneText) return NextResponse.json({error:"sceneText required"},{status:400})
    const dir=path.join(process.cwd(),"storage","images")
    if(!existsSync(dir)) await mkdir(dir,{recursive:true})
    const catKey=(category||"general").toLowerCase().replace(/\s+/g,"")
    const style=STYLES[catKey]||STYLES.general
    const pos=sceneIndex===0?"opening hook":sceneIndex===totalScenes-1?"powerful ending":"building scene"
    const prompt=style+", scene: "+(sceneText||"").slice(0,70)+", "+pos+", no text no watermark"
    console.log("AI Image "+(sceneIndex+1)+"/"+totalScenes+"...")
    const res=await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",{
      method:"POST",
      headers:{"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json","Prefer":"wait"},
      body:JSON.stringify({input:{prompt,aspect_ratio:isShorts?"9:16":"16:9",output_format:"jpg",output_quality:85,num_inference_steps:4,go_fast:true}}),
      signal:AbortSignal.timeout(60000),
    })
    const data=await res.json()
    if(data.error) throw new Error("Replicate: "+data.error)
    const imgUrl=Array.isArray(data.output)?data.output[0]:data.output
    if(!imgUrl) throw new Error("No image from Replicate")
    const fname="ai_"+(videoId||Date.now())+"_s"+sceneIndex+".jpg"
    const fpath=path.join(dir,fname)
    const ir=await fetch(imgUrl,{signal:AbortSignal.timeout(30000)})
    const buf=Buffer.from(await ir.arrayBuffer())
    await writeFile(fpath,buf)
    console.log("AI Image saved: "+fname+" ("+(buf.length/1024).toFixed(0)+"KB)")
    return NextResponse.json({success:true,imageUrl:"/storage/images/"+fname,scene:sceneIndex})
  } catch(err) {
    console.error("AI Image error:",err.message)
    return NextResponse.json({error:err.message},{status:500})
  }
}
