# Hector365 — Deploy करने के Steps

## ज़रूरी: Repo का नाम जान लें
GitHub पर आपकी repo का नाम जो भी है (जैसे `hector365` या `H365`), वो `vite.config.js` फाइल में `base` field में **exactly वैसा ही** होना चाहिए (case-sensitive).

उदाहरण: अगर आपकी website यहाँ खुलनी है:
`https://ayuvraj7.github.io/hector365/`

तो `vite.config.js` में लिखा होना चाहिए:
```js
base: "/hector365/"
```

अगर repo का नाम अलग है (जैसे `H365`), तो ये बदल दें:
```js
base: "/H365/"
```

## Steps (अपने computer पर, terminal/cmd में)

1. **Node.js install करें** (अगर नहीं है) — https://nodejs.org से (LTS version)

2. इस पूरे folder को अपने GitHub repo में डालें (पुराना सब content हटा कर, ये पूरा folder डालें — package.json, src/, index.html, सब कुछ)

3. Terminal खोलें, repo folder में जाएं, फिर run करें:
   ```
   npm install
   npm run build
   ```
   इससे एक `dist` folder बनेगा — यही असली website है (HTML+JS, browser समझ सकता है)

4. **GitHub Pages को बताना है कि `dist` folder से website serve करनी है:**
   - सबसे आसान तरीका: `gh-pages` package इस्तेमाल करें
   ```
   npm install gh-pages --save-dev
   ```
   - फिर `package.json` के "scripts" में ये line जोड़ें:
   ```json
   "deploy": "npm run build && npx gh-pages -d dist"
   ```
   - फिर run करें:
   ```
   npm run deploy
   ```
   ये अपने आप `dist` folder को GitHub Pages पर भेज देगा।

5. कुछ मिनट बाद अपनी website वाला link खोलें — अब असली app दिखेगा, "H365" जैसा blank title नहीं।

## अगर API key का सवाल आए
अभी इस code में Claude API call सीधी browser से जा रही है, बिना key के — ये सिर्फ इस preview environment में काम करता है। Real deployment में, आपको backend (जैसे Vercel Serverless Function) के through Anthropic API key secure तरीके से जोड़नी होगी, वरना ये काम नहीं करेगा। ये अगला step होगा।
