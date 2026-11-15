// Requête OpenRouter de bout en bout (Node 18+).
// La clé est lue dans la variable d'environnement OPENROUTER_API_KEY — jamais dans le code ni dans Git.
//
// Usage :
//   OPENROUTER_API_KEY=sk-or-... node openrouter.mjs "Ta question"
//   OPENROUTER_MODEL=anthropic/claude-sonnet-5.5 node openrouter.mjs "..."   (changer de modèle)
import { OpenRouter } from "@openrouter/sdk";
import { OpenRouterError } from "@openrouter/sdk/models/errors";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-opus-5.5"; // slugs : https://openrouter.ai/models

function getKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error("OPENROUTER_API_KEY n'est pas défini.\nCréez une clé sur https://openrouter.ai/keys puis :\n  export OPENROUTER_API_KEY=sk-or-...");
    process.exit(1);
  }
  return key;
}

export async function ask(prompt, { model = MODEL } = {}) {
  const client = new OpenRouter({
    apiKey: getKey(),
    httpReferer: "https://louissioul1.github.io/erablieres/", // optionnel : classement sur openrouter.ai
    appTitle: "Érablières Grégoire",                          // optionnel
    timeoutMs: 120000,
  });

  const response = await client.responses.send({
    responsesRequest: {
      model,
      instructions: "Tu es un assistant pour une entreprise acéricole au Québec. Réponds en français québécois, de façon brève et pratique.",
      input: prompt,
    },
  });

  if (!("output" in response)) throw new Error("Réponse inattendue (flux au lieu d'une réponse complète).");
  if (response.status !== "completed") throw new Error(response.error?.message ?? `Réponse terminée avec le statut « ${response.status} ».`);

  const message = response.output.find((item) => item.type === "message");
  const text = message?.content?.find((part) => part.type === "output_text")?.text;
  if (!text) throw new Error("Aucun texte dans la réponse.");
  return { text, model: response.model, usage: response.usage };
}

// Exécution en ligne de commande
if (import.meta.url === `file://${process.argv[1]}`) {
  const prompt = process.argv.slice(2).join(" ") || "Donne 3 vérifications à faire sur un réseau de tubulure avant l'entaillage.";
  try {
    const { text, model, usage } = await ask(prompt);
    console.log(text);
    console.error(`\n— ${model}${usage ? ` · ${usage.input_tokens ?? usage.inputTokens ?? "?"} → ${usage.output_tokens ?? usage.outputTokens ?? "?"} jetons` : ""}`);
  } catch (err) {
    if (err instanceof OpenRouterError) {
      const hints = { 401: "Clé invalide ou révoquée.", 402: "Crédits insuffisants sur le compte OpenRouter.", 404: `Modèle introuvable : ${MODEL}`, 429: "Trop de requêtes — réessayez dans un moment.", 503: "Fournisseur indisponible — réessayez." };
      console.error(`Erreur OpenRouter ${err.statusCode} : ${hints[err.statusCode] ?? err.message}`);
    } else {
      console.error("Erreur :", err.message ?? err);
    }
    process.exit(1);
  }
}
