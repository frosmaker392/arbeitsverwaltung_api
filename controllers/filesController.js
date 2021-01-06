const fs = require('fs').promises;
const path = require('path');
const root = require('../utils/root');
const { errorObj } = require('../utils/response');
const { svr_logger } = require('../utils/logger');

function handleDownloads(req, res) {
    if (req.params.userId != req.user.id)
        return res.status(401).json(errorObj("Unauthorized"));
    
    const p = path.join(root, `files\\${req.params.userId}`, req.path);

    (async() => {
        const stat = await fs.lstat(p);

        if (req.method === 'GET') 
            await getOrListFiles(res, p, stat);
        else
            throw new Error("Not found");
    })().catch((err) => {
        if (err.code === 'ENOENT') {
            res.status(404).json(errorObj(`Cannot find file ${req.path} under user's directory`));
        } else {
            svr_logger.error(err.message);
            res.status(404).json(errorObj(err.message));
        }
    })
}

async function getOrListFiles(res, filepath, stat) {
    if (stat.isFile()) {
        res.sendFile(filepath);
    } else {
        let outJson = { files: [] }
        const files = await fs.readdir(filepath);

        for (var i in files) {
            const stats = await fs.stat(path.join(filepath, files[i]));
            const isDir = (await fs.lstat(path.join(filepath, files[i]))).isDirectory();

            outJson.files.push({
                name: files[i],
                lastModified: stats.mtime,
                isDirectory: isDir
            });
        }

        res.json(outJson);
    }
}

module.exports = {
    handleDownloads
}