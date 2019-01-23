const fs = require('fs');

const directories = [];
let totalFileCount = 0;

// recurse thru directories
  // Base case = no more directories (at root)
    // Log leaf directory and number of files at that leaf directory
  // Else, for each sub-directory, pass that thru crawl

const crawl = (path) => {
  console.log(`Crawler at: ${path}`);
  if (countDirectories(path) === 0) {
    const fileCount = countFiles(path);
    console.log(`Hit leaf: ${directories[path]} | ${fileCount} files`);
    directories.push({
      folder: path,
      files: fileCount
    });
    totalFileCount += fileCount;
  } else {
    const currentDirectories = getDirectories(path);
    console.log(`Subdirectories: ${currentDirectories}`);
    currentDirectories.forEach(directory => crawl(`${path}/${directory}`));
  }
};

const countDirectories = (path) => {
  let counter = 0;
  const dirContents = fs.readdirSync(path, { withFileTypes: true });
  dirContents.forEach((dirent) => {
    if (dirent.isDirectory()) {
      counter += 1;
    }
  });
  return counter;
};

const getDirectories = (path) => {
  const currentDirectories = [];
  const dirContents = fs.readdirSync(path, { withFileTypes: true });
  dirContents.forEach((dirent) => {
    if (dirent.isDirectory()) {
      currentDirectories.push(dirent.name);
    }
  });
  return currentDirectories;
};

const countFiles = (path) => {
  const files = fs.readdirSync(path).filter((file) => {
    return file !== '.DS_Store';
  });
  files.forEach((file) => {
    console.log('FILE:', file);
  });
  return files.length;
};

crawl('../upload');
fs.writeFileSync('./directories.json', JSON.stringify(directories));
console.log(`Found ${directories.length} leaf directories. Total ${totalFileCount} files.`)

const shortDirectories = directories.filter(dir => dir.files < 2);
fs.writeFileSync('./shortDirectories.json', JSON.stringify(shortDirectories));
