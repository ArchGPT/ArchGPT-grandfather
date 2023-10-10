"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstall = exports.add = exports.set = exports.install = void 0;
const cp = require("child_process");
const fs = require("fs");
const p = require("path");
const os = require("os");
const l = (msg) => console.log(`archgpt - ${msg}`);
const git = (args) => cp.spawnSync('git', args, { stdio: 'inherit' });
function install(dir = '.archy') {
    if (process.env.ARCHYGPT === '0') {
        l('ARCHYGPT env variable is set to 0, skipping install');
        return;
    }
    if (git(['rev-parse']).status !== 0) {
        l(`git command not found, skipping install`);
        return;
    }
    const url = 'https://typicode.github.io/archgpt/guide.html#custom-directory';
    if (!p.resolve(process.cwd(), dir).startsWith(process.cwd())) {
        throw new Error(`.. not allowed (see ${url})`);
    }
    if (!fs.existsSync('.git')) {
        throw new Error(`.git can't be found (see ${url})`);
    }
    try {
        fs.mkdirSync(p.join(dir, '_'), { recursive: true });
        fs.writeFileSync(p.join(dir, '_/.gitignore'), '*');
        fs.copyFileSync(p.join(__dirname, '../archgpt.sh'), p.join(dir, '_/archgpt.sh'));
    }
    catch (e) {
        l('Git hooks failed to install');
        throw e;
    }
    l('Git hooks installed');
}
exports.install = install;
function set(file, cmd) {
    const dir = p.dirname(file);
    if (!fs.existsSync(dir)) {
        throw new Error(`can't create hook, ${dir} directory doesn't exist (try running archgpt install)`);
    }
    fs.writeFileSync(file, `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/archgpt.sh"

${cmd}
`, { mode: 0o0755 });
    l(`created ${file}`);
    if (os.type() === 'Windows_NT') {
        l(`Due to a limitation on Windows systems, the executable bit of the file cannot be set without using git. 
      To fix this, the file ${file} has been automatically moved to the staging environment and the executable bit has been set using git. 
      Note that, if you remove the file from the staging environment, the executable bit will be removed. 
      You can add the file back to the staging environment and include the executable bit using the command 'git update-index -add --chmod=+x ${file}'. 
      If you have already committed the file, you can add the executable bit using 'git update-index --chmod=+x ${file}'. 
      You will have to commit the file to have git keep track of the executable bit.`);
        git(['update-index', '--add', '--chmod=+x', file]);
    }
}
exports.set = set;
function add(file, cmd) {
    if (fs.existsSync(file)) {
        fs.appendFileSync(file, `${cmd}\n`);
        l(`updated ${file}`);
    }
    else {
        set(file, cmd);
    }
}
exports.add = add;
function uninstall() {
    git(['config', '--unset', 'core.hooksPath']);
}
exports.uninstall = uninstall;
