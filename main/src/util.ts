import fs from 'fs';

export const writeFileSyncAndCreateFolderINE = (path: string, data: string) => {
  fs.mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true })
  fs.writeFileSync(path, data)
}