'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let nextJsConfigProvider = vscode.languages.registerCompletionItemProvider(
    {
      language: 'javascript',
      pattern: '**/*next.config.js'
    },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        const filePath = document.fileName;
        const line = document.lineAt(position);

        // helper
        const getScopeCount = (currentLine: number): number => {
          let scopes = 0;
          for (let i = currentLine; i > 0; i--) {
            if (document.lineAt(i).text.indexOf('{') >= 0) {
              scopes++;
            }
          }

          return scopes;
        };

        const moduleExportsExists =
          document.getText().indexOf('module.exports') >= 0;
        // helper

        let snippets: Array<{
          item: string;
          itemTarget: string;
          description: string;
          kind: number;
        }>;
        snippets = [];

        if (!moduleExportsExists) {
          snippets = [
            ...snippets,
            {
              item: 'module.exports',
              itemTarget: 'module.exports = {\n\t$0\n};',
              description: 'entry',
              kind: 14
            }
          ];
        }

        if (getScopeCount(line.lineNumber) > 0) {
          snippets = [
            ...snippets,
            {
              item: 'crossOrigin',
              itemTarget: "crossOrigin: '${1:anonymous}',",
              description:
                'If your CDN is on a separate domain and you would like assets to be requested using a CORS aware request you can set a config option for that.',
              kind: 9
            },
            {
              item: 'assetPrefix',
              itemTarget:
                "assetPrefix: isProd ? '${1:https://cdn.mydomain.com}' : '',",
              description:
                "To set up a CDN, you can set up this setting and configure your CDN's origin to resolve to the domain that Next.js is hosted on.",
              kind: 9
            },
            {
              item: 'serverRuntimeConfig',
              itemTarget:
                "serverRuntimeConfig: {\n\t${1:mySecret}: '${2:secret}'\n},",
              description:
                'Place any server-only runtime config under this property.',
              kind: 14
            },
            {
              item: 'publicRuntimeConfig',
              itemTarget:
                "publicRuntimeConfig: {\n\t${1:staticFolder}: '${2:/static}'\n},",
              description:
                'Anything accessible to both client and server-side code should be under this.',
              kind: 14
            },
            {
              item: 'target',
              itemTarget: "target: '${1|serverless|}',",
              description: 'For example to enable serverless mode in Next.js',
              kind: 9
            },
            {
              item: 'env',
              itemTarget: "env: {\n\t$1: '$2'\n},",
              description: 'Expose environment variables to your app.',
              kind: 2
            },
            {
              item: 'webpack',
              itemTarget: 'webpack: config => config,',
              description: 'Manipulate the webpack config.',
              kind: 2
            },
            {
              item: 'exportPathMap',
              itemTarget:
                "exportPathMap: async function(defaultPathMap) {\n\treturn {\n\t\t'${1:/}': {\n\t\t\tpage: '${2:/}',\n\t\t\tquery: { title: '${3:hello-nextjs}' }\n\t\t}\n\t}\n},",
              description:
                'The way next export works is by pre-rendering all pages possible to HTML. It does so based on this mapping of pathname key to page.',
              kind: 2
            }
          ].filter(s => {
            for (let i = line.lineNumber - 1; i >= 0; i--) {
              if (document.lineAt(i).text.indexOf(s.item) >= 0) {
                return false;
              }
            }

            return true;
          });

          const allSnippets = snippets.map(
            ({ item, itemTarget, description, kind }) => {
              const snippetTarget = new vscode.CompletionItem(
                'next: ' + item,
                kind
              );
              snippetTarget.insertText = new vscode.SnippetString(itemTarget);
              snippetTarget.documentation = new vscode.MarkdownString(
                description
              );

              return snippetTarget;
            }
          );

          return [...allSnippets];
        }
      }
    }
  );

  context.subscriptions.push(nextJsConfigProvider);
}
