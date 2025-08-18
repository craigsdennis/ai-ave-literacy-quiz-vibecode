import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/hello', async(c) => {
    
    return c.json({hello: "world"});
});

export default app;