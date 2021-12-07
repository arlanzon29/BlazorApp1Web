
export function synchronizeFileWithIndexedDb(filename) {
   
    return new Promise((res, rej) => {
        const db = window.indexedDB.open('SqliteStorage', 1);
        db.onupgradeneeded = () => {
            db.result.createObjectStore('Files', { keypath: 'id' });
        };

        db.onsuccess = () => {
            const req = db.result.transaction('Files', 'readonly').objectStore('Files').get('file');
            req.onsuccess = () => {
                Module.FS_createDataFile('/', filename, req.result, true, true, true);
                console.log("Creo  Fichero" );
                res();
            };
        };
    
        let lastModifiedTime = new Date();
        const inter=setInterval(() => {
            const path = `/${filename}`;
            if (FS.analyzePath(path).exists) {
                const mtime = FS.stat(path).mtime;

                if (mtime.valueOf() !== lastModifiedTime.valueOf()) {
                    console.log("Actualizo IndexDB");
                    lastModifiedTime = mtime;
                    const data = FS.readFile(path);
                    db.result.transaction('Files', 'readwrite').objectStore('Files').put(data, 'file');
                }
            }
            else {
                console.log("Borro base de datos");
                db.result.close();
                window.indexedDB.deleteDatabase('SqliteStorage');
                clearInterval(inter);
            }
        }, 1000);
    });
}


export function removeFile(filename) {
    const path = `/${filename}`;
    FS.unlink(path, function (err) {
        if (err) return console.log(err);
        console.log('file deleted successfully');
    });
}


export function downloadFile(mimeType, base64String, fileName) {

    var fileDataUrl = "data:" + mimeType + ";base64," + base64String;
    fetch(fileDataUrl)
        .then(response => response.blob())
        .then(blob => {

            //create a link
            var link = window.document.createElement("a");
            link.href = window.URL.createObjectURL(blob, { type: mimeType });
            link.download = fileName;

            //add, click and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
}

window.bufferToCanvas = function(elem, buffer, width, height) {
    let imageData = new ImageData(new Uint8ClampedArray(buffer.buffer, 0, width * height * 4), width, height);
    elem.width = width;
    elem.height = height;
    elem.getContext('2d').putImageData(imageData, 0, 0);
}
