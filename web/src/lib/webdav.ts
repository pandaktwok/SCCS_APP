import { createClient } from "webdav";

// As chaves devem estar no .env para segurança em produção
const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || "https://nextcloud.sccruzeirodosul.org/remote.php/webdav";
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME || "casaos";
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD || "casaos";

// Cliente WebDAV global
export const webdavClient = createClient(NEXTCLOUD_URL, {
    username: NEXTCLOUD_USERNAME,
    password: NEXTCLOUD_PASSWORD
});

/**
 * Cria a estrutura de pastas dinamicamente se não existir
 * Ex: /historico/2026/02/T3200
 */
export async function ensureWebdavDirectory(paths: string[]) {
    let currentPath = "";
    for (const folder of paths) {
        currentPath += `/${folder}`;
        try {
            const exists = await webdavClient.exists(currentPath);
            if (!exists) {
                await webdavClient.createDirectory(currentPath);
            }
        } catch (error) {
            console.error(`Erro ao verificar/criar pasta no Nextcloud: ${currentPath}`, error);
            throw error;
        }
    }
    return currentPath;
}
