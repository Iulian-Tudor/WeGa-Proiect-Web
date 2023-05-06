import http from 'http';
import fs from 'fs';

import { handleTest } from './test.js';

const port = 3000;

const routes = new Map();

registerRoute('/test', handleTest);

function registerRoute(route, handler) {
    routes.set(route, handler);
}

registerRoute('/', (req, res) => {
    res.write('Hello world');
    res.statusCode = 200;
    res.end();
});

const server = http.createServer(async (req, res) => {
    if(!routes.has(req.url)) {
        try {
            const data = await fs.promises.readFile('..' + req.url);
            res.statusCode = 200;
            res.end(data);
        } catch(err) {
            res.statusCode = 404;
            res.end('Not found');
        }
        return;
    }

    const handler = routes.get(req.url);
    handler(req, res);
});

server.listen(port, () => {
    console.log(`listening on port ${port}...`);
});
