# **Simple and easy statistics**

`expressjs-stats` is a small NPM package that allows you to create simple statistics for your ExpressJS REST API.

### **Installation**

```bash
npm install expressjs-stats
```

## **Middleware implementation**

The setup is super easy and done in under a minute. Just import `routesTracker` from `expressjs-stats`:

```js
const { routesTracker } = require('expressjs-stats')
```

After that add it to any route you want to get tracked.

```js
app.get('/', routesTracker, async (req, res) => {
    return res.send('Awesome!')
})
```

And you are completely done. Congratulations!

## **Get statistics data**

We do not only want to track them but also access the data. Simply import `getStats` from `expressjs-stats`.

```js
const { routesTracker, getStats } = require('expressjs-stats')
```

Now await this function anywhere you want and get the data.

```js
app.get('/stats', routesTracker, async(req, res) => {
    const stats = await getStats()
    return res.send(stats)
})
```

There's also the `range` option. You can define the time period in which you want to get all the data. The default value is `alltime`.

**Examples:**
- `20min`
- `3d`
- `90d`
- `1y`

```js
app.get('/stats', routesTracker, async(req, res) => {
    const stats = await getStats(range = '1h')
    return res.send(stats)
})
```

**Example Response:**
```json
```