import { state, ScheduledCmd } from "./State";
import * as log from "./Log";

export function init() {
  window.requestAnimationFrame(step);
  log.log("Cmd module initialized");
}

export function shutdown() {
  // nothing here
}

function step() {
  const { cmds } = state;
  while (cmds.buffer.length) {
    const cmd = cmds.buffer.shift() as ScheduledCmd;
    if (cmds.funcs[cmd.name]) {
      cmds.funcs[cmd.name](cmd.data).then((data?) => {
        cmd.resolve(data);
      }).catch((data?) => {
        log.log(`Cmd::step - ${cmd.name} resulted in rejection`);
        cmd.reject(data);
      });
    } else {
      log.log("Games::step - command not found (" + cmd.name + ")");
    }
  }
  window.requestAnimationFrame(step);
}

export function add_cmds(commands: [string, (data?: any) => Promise<any>][]) {
  commands.forEach(([name, func]) => add_cmd(name, func));
}

export function add_cmd(name: string, func: (data?: any) => Promise<any>) {
  const { cmds } = state;

  cmds.funcs[name] = func;
}

// export function run_cmd(name: string, data?: any) {
  
// }

export function schedule_cmd(name: string, data?: any) {
  const { cmds } = state;

  let _resolve;
  let _reject;
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  cmds.buffer.push({name, data, resolve: _resolve, reject: _reject});
  return promise;
}

// export function cmd_add_cmd(name: string, func: (data?: any) => void) {
  
// }
