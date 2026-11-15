# OpenRouter — Érablières Grégoire

Script Node qui envoie une requête à OpenRouter avec le SDK officiel `@openrouter/sdk`.

## Lancer

```bash
cd ai
npm install
export OPENROUTER_API_KEY=sk-or-...        # clé créée sur https://openrouter.ai/keys
npm run ask -- "Combien de chalumeaux pour 1200 entailles ?"
```

Changer de modèle : `OPENROUTER_MODEL=anthropic/claude-sonnet-5.5 npm run ask -- "..."`
(liste des modèles sur https://openrouter.ai/models).

## Important

- La clé reste dans la variable d'environnement. Elle ne va jamais dans le code, dans `config.js`
  ni dans les apps web : GitHub Pages est public et toute clé mise dans le navigateur peut être lue.
- Pour appeler OpenRouter depuis les apps, il faudra un petit serveur intermédiaire
  (ex. Cloudflare Worker) qui garde la clé et vérifie la connexion Firebase.
