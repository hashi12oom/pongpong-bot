import http from "node:http";
import fs from "node:fs";

const port = process.env.PORT || 10000;
const html = fs.readFileSync(new URL("./website/index.html", import.meta.url), "utf8");

http.createServer((req,res)=>{
  res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
  res.end(html);
}).listen(port, "0.0.0.0", ()=>console.log("PongPong website running on port "+port));
