import fs from 'fs';
import _ from 'lodash';

export type ReadFileOutput = string | { [name: string]: ReadFileOutput }

export const readFileRecursively = (_filePath: string, onlyNames = false,
  filterFile = (a: string): boolean => true,
  filterFolder = (a: string): boolean => !a.startsWith('.'),
): ReadFileOutput => {
  const filePath = _filePath.trim();
  // if it is a directory, we return all the files in the directory
  if (fs.lstatSync(filePath).isDirectory()) {
    const fileNames = fs.readdirSync(filePath);
    const isDir = (fileName: string) => fs.lstatSync(`${filePath}/${fileName}`).isDirectory();
    const names = fileNames.filter((a) => {
      return isDir(a) ? filterFolder(a) : filterFile(a)
    })
    // console.log('names _ ', _filePath, names)
    const fileContents = names.map((fileName) => {
      const file = readFileRecursively(`${filePath}/${fileName}`, onlyNames, filterFile, filterFolder);
      return file;
    });
    return _.zipObject(names, fileContents) as ReadFileOutput;
  } else {
    return onlyNames ? '' : fs.readFileSync(filePath, 'utf8');
  }
};


const a = readFileRecursively(__dirname, false, (a) => a.endsWith(".ts"))

console.log("x", a);
