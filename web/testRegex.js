const url = "http://nextcloud.sccruzeirodosul.org/remote.php/dav/files/casaos/Invoices/NF_6_RESTAURANTE_SABOR_DCASA_LTDA_ME.pdf";

let nextcloudPath = url;
const match = nextcloudPath.match(/remote\.php\/(?:webdav|dav\/files\/[^/]+)\/(.*)/);
if (match && match[1]) {
    nextcloudPath = '/' + match[1];
}

console.log("FINAL:", nextcloudPath);
