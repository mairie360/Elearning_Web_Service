const assert = require('node:assert/strict');
const { before,after,beforeEach,afterEach,test } = require('node:test');
require('./support/load-typescript.cjs');
const { createSessionRefreshHandler,createSessionLogoutHandler,forgetUserSession } = require('@mairie360/front-kit/next');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { ContractMockServer } = require('./support/contract-mock-server.ts');
const { FrontRuntime,FRONT_ORIGIN } = require('./support/front-runtime.ts');
const { installWindow,removeWindow } = require('./support/browser.ts');
const f = require('./support/elearning-fixtures.ts');
const { requestBff } = require('../src/lib/bff-client.ts');
const auth = require('../src/lib/auth-session.ts');
const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
const training = new ContractMockServer('ELEARNING',OpenApiContract.load('contracts/openapi.json'));
const user = new ContractMockServer('LOGIN_USER',OpenApiContract.load('tests/fixtures/user-session-openapi.json'));
const runtime = new FrontRuntime(()=>[training.url,user.url]);
const owner={origin:'https://login.mairie.test',calls:[]};runtime.owner=owner;
let access,refresh,browser;
before(async()=>{
 await training.start();await user.start();runtime.install();
 const config={userBffUrl:()=>user.url,cookieOptions:()=>({secure:false}),allowedOrigins:()=>[FRONT_ORIGIN,owner.origin]};
 const handlers={'/api/auth/refresh':createSessionRefreshHandler(config),'/api/auth/logout':createSessionLogoutHandler(config)};
 owner.handle=request=>{if(owner.override)return owner.override(request);const handler=handlers[request.nextUrl.pathname];if(!handler)throw Error('Undeclared owner operation');return handler(request);};
});
after(async()=>{runtime.restore();await training.stop();await user.stop();removeWindow();});
beforeEach(()=>{
 training.reset();user.reset();runtime.reset();owner.calls.length=0;owner.override=undefined;
 access=f.accessToken(2,Math.floor(Date.now()/1000)+3600);refresh='disposable-training-'+Math.random();
 runtime.accessToken=f.accessToken(2,1);runtime.refreshToken=refresh;
 process.env.BFF_ELEARNING_BASE_URL=training.url;process.env.ELEARNING_FRONT_URL=FRONT_ORIGIN;process.env.LOGIN_FRONT_URL=owner.origin;
 setBrowserFrontUrls({ELEARNING_FRONT_URL:FRONT_ORIGIN,LOGIN_FRONT_URL:owner.origin});browser=installWindow();browser.location.href=FRONT_ORIGIN+'/?course=4';
});
afterEach(()=>{forgetUserSession(user.url,refresh);forgetUserSession(user.url,runtime.refreshToken);const violations=[...training.violations,...user.violations,...runtime.violations];removeWindow();assert.deepEqual(violations,[]);});
const rejected=status=>({status,body:{message:'Disposable refusal'},outOfContract:true});
const renewed=()=>user.on('post','/auth/refresh',{body:{message:'JWT refreshed successfully'},headers:{'Set-Cookie':[
 `accessToken=${access}; Path=/auth; HttpOnly; Max-Age=3600`, `refreshToken=renewed-${refresh}; Path=/auth; HttpOnly`,
]}});
test('the actual catalogue rotates once at Login and retries using only cookie-derived authorization',async()=>{
 renewed();training.on('get','/elearning/catalog',request=>request.headers.authorization===`Bearer ${access}`?{body:f.catalogResponse()}:rejected(401));
 assert.deepEqual(await requestBff('/elearning/catalog',{headers:{Authorization:'Bearer untrusted-browser'}}),f.catalogResponse());
 assert.equal(training.requests.length,1);assert.equal(user.requests.length,1);assert.equal(user.requests[0].template,'/auth/refresh');
 assert.deepEqual(user.requests[0].body,{refresh_token:refresh});assert.equal(user.requests[0].headers.authorization,undefined);
 assert.equal(runtime.accessToken,access);assert.deepEqual(browser.location.assigned,[]);
 assert.deepEqual(runtime.frontCalls.map(x=>x.pathname),['/elearning/catalog','/api/auth/refresh','/elearning/catalog']);
});
for(const status of [401,503])test(`failed owner renewal${status} neither replays a learner mutation nor invokes logout`,async()=>{
 browser.localStorage.setItem('mairie360.auth.jwt','legacy');browser.localStorage.setItem('unrelated.preference','keep');
 training.on('post','/elearning/courses/{courseId}/start',rejected(401));owner.override=()=>Response.json({message:'Disposable refusal'},{status});
 await assert.rejects(requestBff('/elearning/courses/4/start',{method:'POST'}));
 assert.equal(training.requests.length,0);assert.equal(owner.calls.length,1);assert.equal(owner.calls[0].path,'/api/auth/refresh');
 assert.equal(runtime.refreshToken,refresh);assert.equal(user.requests.length,0);assert.equal(browser.location.assigned.length,status===401?1:0);
 assert.equal(browser.localStorage.getItem('mairie360.auth.jwt'),status===401?null:'legacy');assert.equal(browser.localStorage.getItem('unrelated.preference'),'keep');
 if(status===401)assert.equal(new URL(browser.location.assigned[0]).searchParams.get('redirect'),browser.location.href);
});
test('foreign catalogue and logout requests are refused before any service or cookie change',async()=>{
 runtime.accessToken=access;
 for(const [path,init] of [['/elearning/catalog',{}],['/api/auth/logout',{method:'POST',body:'{}'}]]){
  const response=await fetch(path,{...init,headers:{Origin:'https://foreign.test','Content-Type':'application/json'}});assert.equal(response.status,403);assert.equal(response.headers.get('set-cookie'),null);
 }
 assert.equal(owner.calls.length,0);assert.equal(training.requests.length,0);assert.equal(user.requests.length,0);assert.equal(runtime.refreshToken,refresh);
});
test('an unconfirmed owner logout receipt retains known legacy storage and an explicit return choice',async()=>{
 runtime.accessToken=access;browser.localStorage.setItem('mairie360.auth.jwt','legacy');browser.localStorage.setItem('unrelated.preference','keep');
 user.on('post','/auth/logout',{body:{message:'Unconfirmed',session_revoked:false}});
 await assert.rejects(auth.logout(),/déconnexion n’a pas été confirmée/);assert.equal(user.requests.length,1);assert.equal(training.requests.length,0);
 assert.equal(browser.localStorage.getItem('mairie360.auth.jwt'),'legacy');assert.equal(browser.localStorage.getItem('unrelated.preference'),'keep');
 assert.deepEqual(browser.location.assigned,[]);assert.equal(auth.navigateToLogin(),false);assert.equal(auth.navigateToLogin({explicit:true}),true);
 assert.equal(new URL(browser.location.assigned[0]).searchParams.get('redirect'),browser.location.href);
 assert.equal(browser.localStorage.getItem('mairie360.auth.jwt'),null);assert.equal(browser.localStorage.getItem('unrelated.preference'),'keep');
});
