#!/usr/bin/env python3
import cgi, json, os, pathlib, re, subprocess, tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT=pathlib.Path('/var/www/html'); ALLOWED={'home.html','news.html','bands.html','hs.html','About.html'}
def safe_name(name): return re.sub(r'[^0-9A-Za-zА-Яа-яЁё._() !№+-]','_',pathlib.Path(name).name)
def commit(message,*paths):
    subprocess.run(['git','-c','safe.directory=/var/www/html','-C',str(ROOT),'add','--',*map(str,paths)],check=False)
    subprocess.run(['git','-c','safe.directory=/var/www/html','-C',str(ROOT),'commit','-m',message],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['git','-c','safe.directory=/var/www/html','-C',str(ROOT),'push','origin','main'],check=True,stdout=subprocess.DEVNULL)
def media_cmd(*args):
    env=os.environ.copy(); password=pathlib.Path('/etc/shunder-media-password').read_text().strip(); env['SSHPASS']=password
    return subprocess.run(['sshpass','-e',*args],env=env,check=True)
class Api(BaseHTTPRequestHandler):
    def out(self,status=200,data=None):
        raw=json.dumps(data or {},ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def body(self): return json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))) or b'{}')
    def do_GET(self):
        if self.path!='/state': return self.out(404,{'error':'not found'})
        self.out(data={'tracks':json.loads((ROOT/'tracks.json').read_text(encoding='utf-8')),'photos':json.loads((ROOT/'img/photoalbum/manifest.json').read_text(encoding='utf-8'))})
    def do_POST(self):
        try:
            if self.path=='/page':
                d=self.body(); name=d.get('file'); html=d.get('html','')
                if name not in ALLOWED or '<html' not in html.lower(): raise ValueError('Недопустимая страница')
                (ROOT/name).write_text(html,encoding='utf-8');commit('Update '+name,name);return self.out(data={'ok':True})
            if self.path=='/upload':
                form=cgi.FieldStorage(fp=self.rfile,headers=self.headers,environ={'REQUEST_METHOD':'POST','CONTENT_TYPE':self.headers['Content-Type']}); typ=form.getvalue('type'); item=form['file']; name=safe_name(item.filename)
                if typ in ('photo','image'):
                    folder=ROOT/('img/photoalbum' if typ=='photo' else 'img/uploads');folder.mkdir(parents=True,exist_ok=True);target=folder/name;target.write_bytes(item.file.read())
                    if typ=='photo':
                        mf=ROOT/'img/photoalbum/manifest.json'; arr=json.loads(mf.read_text(encoding='utf-8'));arr.append(name);mf.write_text(json.dumps(arr,ensure_ascii=False,indent=2),encoding='utf-8');commit('Add photo',target,mf)
                    else: commit('Upload image',target)
                    return self.out(data={'ok':True,'url':'/'+target.relative_to(ROOT).as_posix()})
                if typ=='radio':
                    with tempfile.NamedTemporaryFile(delete=False,suffix=pathlib.Path(name).suffix) as tmp: tmp.write(item.file.read()); local=tmp.name
                    media_cmd('scp','-o','StrictHostKeyChecking=accept-new',local,f'root@194.93.0.223:/var/www/html/radio/{name}');os.unlink(local)
                    mf=ROOT/'tracks.json';arr=json.loads(mf.read_text(encoding='utf-8'));arr.append('radio/'+name);mf.write_text(json.dumps(arr,ensure_ascii=False,indent=2),encoding='utf-8');commit('Add radio track',mf);return self.out(data={'ok':True})
                raise ValueError('Недопустимый тип')
            self.out(404,{'error':'not found'})
        except Exception as e: self.out(400,{'error':str(e)})
    def do_DELETE(self):
        try:
            d=self.body();typ=d.get('type');name=d.get('name')
            if typ=='photo':
                name=safe_name(name); target=ROOT/'img/photoalbum'/name;target.unlink(missing_ok=True);mf=ROOT/'img/photoalbum/manifest.json';arr=json.loads(mf.read_text(encoding='utf-8'));arr=[x for x in arr if x!=name];mf.write_text(json.dumps(arr,ensure_ascii=False,indent=2),encoding='utf-8');commit('Delete photo',target,mf)
            elif typ=='radio':
                if not str(name).startswith('radio/'):raise ValueError('bad name')
                base=safe_name(pathlib.Path(name).name);media_cmd('ssh','-o','StrictHostKeyChecking=accept-new','root@194.93.0.223','rm','--',f'/var/www/html/radio/{base}');mf=ROOT/'tracks.json';arr=json.loads(mf.read_text(encoding='utf-8'));arr=[x for x in arr if x!=name];mf.write_text(json.dumps(arr,ensure_ascii=False,indent=2),encoding='utf-8');commit('Delete radio track',mf)
            else: raise ValueError('bad type')
            self.out(data={'ok':True})
        except Exception as e:self.out(400,{'error':str(e)})
    def log_message(self,fmt,*args): print(fmt%args)
ThreadingHTTPServer(('127.0.0.1',8765),Api).serve_forever()
