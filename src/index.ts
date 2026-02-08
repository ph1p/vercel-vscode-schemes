"use strict";

import * as https from "https";
import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";

const SCHEMAS = [
  {
    url: "https://openapi.vercel.sh/vercel.json",
    file: "vercel.json",
  },
  {
    url: "https://turbo.build/schema.json",
    file: "turbo.json",
  },
];

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetch(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

export async function activate(context: vscode.ExtensionContext) {
  const schemasDir = path.join(context.extensionPath, "schemas");
  let updated = false;

  for (const schema of SCHEMAS) {
    try {
      const content = await fetch(schema.url);
      JSON.parse(content);
      const target = path.join(schemasDir, schema.file);
      const current = fs.readFileSync(target, "utf-8");

      if (content !== current) {
        fs.writeFileSync(target, content);
        updated = true;
      }
    } catch {
      // fetch or write failed — bundled fallback is already on disk
    }
  }

  if (updated) {
    const action = await vscode.window.showInformationMessage(
      "Vercel Schemes: JSON schemas have been updated.",
      "Reload Window",
    );

    if (action === "Reload Window") {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }
}
