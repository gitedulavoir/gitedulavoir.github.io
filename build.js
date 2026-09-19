#!/usr/bin/env node
"use strict";
/**
 * Générateur statique minimal, sans dépendance.
 *
 * - le contenu vit dans content/site.json (voir README pour l'éditer)
 * - la mise en page vit dans templates/*.html, découpée en petits fichiers
 * - ce script assemble les deux, une fois par langue, dans dist/
 *
 * Syntaxe de template supportée (volontairement minimale) :
 *   {{> partials/nom}}        inclut templates/partials/nom.html
 *   {{chemin.vers.valeur}}    insère une valeur du contexte
 *   {{#each chemin.vers.liste}} ... {{this.champ}} ... {{/each}}
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CONTENT_FILE = path.join(ROOT, "content", "site.json");
const TEMPLATES_DIR = path.join(ROOT, "templates");
const ASSETS_DIR = path.join(ROOT, "assets");
const OUT_DIR = path.join(ROOT, "dist");
const LANGS = ["fr", "en"];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// --- 1. Résoudre la langue -------------------------------------------------
// Un noeud { "fr": "...", "en": "..." } devient directement la chaîne de la
// langue choisie. Tout le reste (nombres, tableaux, liens, chemins d'image)
// traverse tel quel. Ça permet d'écrire le contenu une fois, dans les deux
// langues côte à côte, sans jamais mettre de logique de langue dans les
// templates.
function isTranslatable(node) {
  return (
    node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    Object.keys(node).every((k) => LANGS.includes(k))
  );
}

function resolveLang(node, lang) {
  if (Array.isArray(node)) return node.map((n) => resolveLang(n, lang));
  if (isTranslatable(node)) return node[lang];
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = resolveLang(v, lang);
    return out;
  }
  return node;
}

function getPath(ctx, dotted) {
  return dotted
    .split(".")
    .reduce((v, key) => (v == null ? undefined : v[key]), ctx);
}

// --- 2. Inclusion des partials ---------------------------------------------
function loadTemplate(relPath) {
  const file = path.join(TEMPLATES_DIR, relPath.endsWith(".html") ? relPath : relPath + ".html");
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(/{{>\s*([\w./-]+)\s*}}/g, (_, inc) => loadTemplate(inc));
  return text;
}

// --- 3. Rendu : boucles puis variables --------------------------------------
function renderEach(template, ctx) {
  const eachRe = /{{#each\s+([\w.]+)}}([\s\S]*?){{\/each}}/g;
  return template.replace(eachRe, (_, listPath, inner) => {
    const list = getPath(ctx, listPath) || [];
    return list
      .map((item, index) => {
        const itemCtx = { ...ctx, this: item, "@index": index + 1 };
        return renderVars(renderEach(inner, itemCtx), itemCtx);
      })
      .join("");
  });
}

function renderVars(template, ctx) {
  return template.replace(/{{\s*([\w.@]+)\s*}}/g, (whole, varPath) => {
    const value = getPath(ctx, varPath);
    return value === undefined || value === null ? "" : String(value);
  });
}

function render(template, ctx) {
  return renderVars(renderEach(template, ctx), ctx);
}

// --- 4. Copie des dossiers statiques ----------------------------------------
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// --- 5. Construction ---------------------------------------------------------
function build() {
  const raw = readJSON(CONTENT_FILE);
  const pageTemplate = loadTemplate("page.html");

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  copyDir(ASSETS_DIR, path.join(OUT_DIR, "assets"));

  for (const lang of LANGS) {
    const content = resolveLang(raw, lang);
    const ctx = {
      ...content,
      lang,
      year: new Date().getFullYear(),
      home: ".", // lien du logo : toujours la racine de la langue courante
      root: lang === "fr" ? "." : "..", // pour retrouver dist/ depuis la page courante (assets)
      fr_href: lang === "fr" ? "." : "../",
      en_href: lang === "fr" ? "en/" : ".",
    };
    const html = render(pageTemplate, ctx);

    const outFile =
      lang === "fr"
        ? path.join(OUT_DIR, "index.html")
        : path.join(OUT_DIR, lang, "index.html");
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    console.log("écrit :", path.relative(ROOT, outFile));
  }
}

build();
