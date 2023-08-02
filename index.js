const fs = require('fs');
const path = require('path');
const colors = require('colors');
const markdownLinkExtractor = require('markdown-link-extractor');

colors.setTheme({

  info: 'green',
  warn: 'yellow',
  error: 'red'
});

// // Función auxiliar para extraer los archivos .md de un directorio de manera recursiva
// function extractMDFilesFromDir(dirPath) {
//   const extractor = new markdownLinkExtractor();
//   const mdFiles = [];

//   fs.readdirSync(dirPath).forEach((file) => {
//     const filePath = path.join(dirPath, file);

//     if (fs.statSync(filePath).isFile() && path.extname(filePath) === '.md') {
//       const mdContent = fs.readFileSync(filePath, 'utf-8');
//       const links = extractor.extract(mdContent); // Extraer los enlaces del archivo .md
//       mdFiles.push({
//         path: filePath,
//         content: mdContent,
//         links: links, // Agregar los enlaces al objeto
//       });
//     } else if (fs.statSync(filePath).isDirectory()) {
//       mdFiles.push(...extractMDFilesFromDir(filePath));
//     }
//   });

//   return mdFiles;
// }

// const mdLinks = (route = process.argv[2]) => {
//   return new Promise((resolve, reject) => {
//     const isAbsolute = path.isAbsolute(route);
//     const absoluteRoute = isAbsolute ? route : path.resolve(route);

//     if (!fs.existsSync(absoluteRoute)) {
//       console.error(colors.error(`El archivo en la ruta ${absoluteRoute} no existe.`));
//       reject(new Error('Archivo no encontrado'));
//     } else {
//       console.log(colors.info(`El archivo en la ruta ${absoluteRoute} existe.`));

//       fs.stat(absoluteRoute, (error, stats) => {
//         if (error) {
//           console.error(colors.error(`Error al obtener información de la ruta ${absoluteRoute}.`));
//           reject(error);
//         } else {
//           if (stats.isFile()) {
//             console.log(`La ruta "${absoluteRoute}" es un archivo.`);
//             resolve({ type: 'file', path: absoluteRoute });
//           } else if (stats.isDirectory()) {
//             console.log(colors.warn(`La ruta "${absoluteRoute}" es un directorio.`));

//             const files = fs.readdirSync(absoluteRoute);
//             if (!files.length) {
//               console.log(colors.warn(`El directorio "${absoluteRoute}" está vacío.`));
//               resolve({ type: 'directory', path: absoluteRoute, contents: [], links: [] });
//             } else {
//               const promises = files.map((file) => {
//                 const fileOrDirPath = path.join(absoluteRoute, file);
//                 return mdLinks(fileOrDirPath);
//               });

//               Promise.all(promises)
//                 .then((results) => {
//                   const mergedResults = results.flat();
//                   resolve({ type: 'directory', path: absoluteRoute, contents: mergedResults });
//                 })
//                 .catch((error) => {
//                   reject(error);
//                 });
//             }
//           } else {
//             console.log(`La ruta "${absoluteRoute}" no es ni un archivo ni un directorio.`);
//             reject(new Error('Ruta desconocida'));
//           }
//         }
//       });
//     }
//   });
// };

const mdLinks = (route = process.argv[2]) => {
  // Función auxiliar para extraer los archivos .md de un directorio de manera recursiva
  function extractLinksFromMarkdown(content) {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      links.push({ text, url });
    }
    return links;
  }
  
  function extractMDFilesFromDir(dirPath) {
    const mdFiles = [];
  
    fs.readdirSync(dirPath).forEach((file) => {
      const filePath = path.join(dirPath, file);
  
      if (fs.statSync(filePath).isFile() && path.extname(filePath) === '.md') {
        const mdContent = fs.readFileSync(filePath, 'utf-8');
        if (typeof mdContent === 'string' && mdContent.trim() !== '') {
          const links = extractLinksFromMarkdown(mdContent); // Extraer los enlaces del archivo .md usando la función con expresión regular
          mdFiles.push({
            path: filePath,
            content: mdContent,
            links: links,
          });
        } else {
          console.error(colors.warn(`El archivo "${filePath}" tiene contenido no válido o está vacío.`));
        }
      } else if (fs.statSync(filePath).isDirectory()) {
        mdFiles.push(...extractMDFilesFromDir(filePath));
      }
    });
  
    return mdFiles;
  }

  return new Promise((resolve, reject) => {
    const isAbsolute = path.isAbsolute(route);
    const absoluteRoute = isAbsolute ? route : path.resolve(route);

    if (!fs.existsSync(absoluteRoute)) {
      console.error(colors.error(`El archivo en la ruta ${absoluteRoute} no existe.`));
      reject(new Error('Archivo no encontrado'));
    } else {
      console.log(colors.info(`El archivo en la ruta ${absoluteRoute} existe.`));

      fs.stat(absoluteRoute, (error, stats) => {
        if (error) {
          console.error(colors.error(`Error al obtener información de la ruta ${absoluteRoute}.`));
          reject(error);
        } else {
          if (stats.isFile()) {
            console.log(`La ruta "${absoluteRoute}" es un archivo.`);
            const mdContent = fs.readFileSync(absoluteRoute, 'utf-8');
            const links = markdownLinkExtractor.extract(mdContent); // Extraer los enlaces del archivo .md
            resolve({ type: 'file', path: absoluteRoute, content: mdContent, links: url });
          } else if (stats.isDirectory()) {
            console.log(colors.warn(`La ruta "${absoluteRoute}" es un directorio.`));

            const files = fs.readdirSync(absoluteRoute);
            if (!files.length) {
              console.log(colors.warn(`El directorio "${absoluteRoute}" está vacío.`));
              resolve({ type: 'directory', path: absoluteRoute, contents: [], links: [] });
            } else {
              const mdFiles = extractMDFilesFromDir(absoluteRoute);
              const allLinks = mdFiles.flatMap((file) => file.links); // Unir los enlaces de todos los archivos .md
              resolve({ type: 'directory', path: absoluteRoute, contents: mdFiles, links: allLinks });
            }
          } else {
            console.log(`La ruta "${absoluteRoute}" no es ni un archivo ni un directorio.`);
            reject(new Error('Ruta desconocida'));
          }
        }
      });
    }
  });
};

mdLinks()
.then(result => {
  // Si es un archivo individual, result.links contendrá los enlaces
  if (result.type === 'file') {
    console.log('Enlaces encontrados en el archivo:');
    for (const link of result.links) {
      console.log(`${link.text} - ${link.url}`);
    }
  }
  // Si es un directorio, result.contents contendrá un array de objetos que pueden tener enlaces
  else if (result.type === 'directory') {
    console.log('Enlaces encontrados en los archivos del directorio:');
    for (const file of result.contents) {
      console.log(`Archivo: ${file.path}`);
      for (const link of file.links) {
        console.log(`${link.text} - ${link.url}`);
      }
    }
  } else {
    console.log('No se encontraron enlaces.');
  }
})
.catch(error => console.error(error));

module.exports = {
  mdLinks,
};

