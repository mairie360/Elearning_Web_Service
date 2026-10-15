const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
require('./support/load-typescript.cjs');
const { getStoredAuthorizationHeader } = require('../src/lib/auth-token.ts');
const savedWindow=global.window;
afterEach(()=>{savedWindow===undefined?delete global.window:global.window=savedWindow;});
test('the optional stored authorization helper stays empty on server, absent or denied browser storage',()=>{
  delete global.window;assert.equal(getStoredAuthorizationHeader(),null);
  global.window={localStorage:{getItem:()=>null}};assert.equal(getStoredAuthorizationHeader(),null);
  global.window={localStorage:{getItem:()=>{throw new Error('storage denied');}}};assert.equal(getStoredAuthorizationHeader(),null);
});
test('stored authorization normalizes whitespace and migrates only the known legacy JWT key',()=>{
  for(const [stored,expected] of [[' fixture-token ','Bearer fixture-token'],['Bearer fixture-token','Bearer fixture-token'],['bearer fixture-token','bearer fixture-token']]){
    const storage=new Map([['mairie360.auth.jwt',stored]]);
    global.window={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
    assert.equal(getStoredAuthorizationHeader(),expected);
  }
  const storage=new Map([['mairie360.projects.jwt',' legacy-token '],['unrelated','keep']]);
  global.window={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
  assert.equal(getStoredAuthorizationHeader(),'Bearer legacy-token');
  assert.equal(storage.get('mairie360.auth.jwt'),'legacy-token');assert.equal(storage.get('unrelated'),'keep');
});
