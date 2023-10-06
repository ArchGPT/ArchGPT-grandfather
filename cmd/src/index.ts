import cp = require('child_process')
import fs = require('fs')
import p = require('path')
import os = require('os')

// Logger
const l = (msg: string): void => console.log(`archgpt - ${msg}`)

// Execute Git command
const git = (args: string[]): cp.SpawnSyncReturns<Buffer> =>
  cp.spawnSync('git', args, { stdio: 'inherit' })

// Install archgpt
export function install(dir = '.archy'): void {
  if (process.env.ARCHYGPT === '0') {
    l('ARCHYGPT env variable is set to 0, skipping install')
    return
  }

  // Ensure that we're inside a Git repository
  // If git command is not found, status is null and we should return
  // That's why status value needs to be checked explicitly
  if (git(['rev-parse']).status !== 0) {
    l(`git command not found, skipping install`)
    return
  }

  // Custom dir help
  const url = 'https://typicode.github.io/archgpt/guide.html#custom-directory'

  // Ensure that we're not trying to install outside of cwd
  if (!p.resolve(process.cwd(), dir).startsWith(process.cwd())) {
    throw new Error(`.. not allowed (see ${url})`)
  }


  try {
    // Create .archy/_
    fs.mkdirSync(p.join(dir, '_'), { recursive: true })

    // Create .archy/_/.gitignore
    fs.writeFileSync(p.join(dir, '_/.gitignore'), '*')

    // Copy archgpt.sh to .archy/_/archgpt.sh
    fs.copyFileSync(p.join(__dirname, '../archgpt.sh'), p.join(dir, '_/archgpt.sh'))

    // Configure repo
    // const { error } = git(['config', 'core.hooksPath', dir])
    // if (error) {
    //   throw error
    // }
  } catch (e) {
    l('Git hooks failed to install')
    throw e
  }

  l('Git hooks installed')
}

// Create a hook file if it doesn't exist or overwrite it
export function set(file: string, cmd: string): void {
  const dir = p.dirname(file)
  if (!fs.existsSync(dir)) {
    throw new Error(
      `can't create hook, ${dir} directory doesn't exist (try running archgpt install)`,
    )
  }

  fs.writeFileSync(
    file,
    `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/archgpt.sh"

${cmd}
`,
    { mode: 0o0755 },
  )

  l(`created ${file}`)

  if (os.type() === 'Windows_NT') {
    l(
      `Due to a limitation on Windows systems, the executable bit of the file cannot be set without using git. 
      To fix this, the file ${file} has been automatically moved to the staging environment and the executable bit has been set using git. 
      Note that, if you remove the file from the staging environment, the executable bit will be removed. 
      You can add the file back to the staging environment and include the executable bit using the command 'git update-index -add --chmod=+x ${file}'. 
      If you have already committed the file, you can add the executable bit using 'git update-index --chmod=+x ${file}'. 
      You will have to commit the file to have git keep track of the executable bit.`,
    )

    git(['update-index', '--add', '--chmod=+x', file])
  }
}

// Create a hook if it doesn't exist or append command to it
export function add(file: string, cmd: string): void {
  if (fs.existsSync(file)) {
    fs.appendFileSync(file, `${cmd}\n`)
    l(`updated ${file}`)
  } else {
    set(file, cmd)
  }
}

// Uninstall archgpt
export function uninstall(): void {
  git(['config', '--unset', 'core.hooksPath'])
}
