import * as assert from 'assert';
import * as path from 'path';

import { CodeAction, commands, DiagnosticSeverity, languages, Range, TextDocument, TextDocumentContentProvider, Uri, window } from 'vscode';
import { commandId } from '../../command';
import { sleep } from '../../sleep';
const getPathDirname = (src: string, parentNumber = 1) => {
  let res = src;
  for (let i = 0; i < parentNumber; i++) res = path.dirname(res);

  return res;
};
const getUri = (fileName: string) => Uri.file(getPathDirname(__dirname, 3) + `/src/test/suite/data/${fileName}.ts`);

function executeCodeActionProvider(uri: Uri, range: Range) {
  return commands.executeCommand<CodeAction[]>('vscode.executeCodeActionProvider', uri, range);
}

interface TypeGenerationOptions {
  expectedType?: string;
  autoImport?: boolean;
}

const performTypeGeneration = async (element: string, document: TextDocument, { expectedType, autoImport }: TypeGenerationOptions = {}) => {
  let fileText = document.getText();
  const f1Position = fileText.indexOf(element);
  const wordRange = document.getWordRangeAtPosition(document.positionAt(f1Position));
  if (!wordRange) {
    assert.fail(`${element} not found in file`);
  }
  const actions = await executeCodeActionProvider(document.uri, wordRange);
  const generateAction = actions?.find((action) => {
    const args = action.command?.arguments;
    return Array.isArray(args) && args.length === (autoImport ? 4 : 3) && action.command!.command === commandId;
  });
  if (!generateAction) assert.fail('Generate action not found');

  const command = generateAction.command!;
  await commands.executeCommand.apply(null, [command.command, ...command.arguments!]);
  if (expectedType) {
    fileText = document.getText();
    const res = fileText.includes(`${element}: ${expectedType}`);
    assert.strictEqual(res, true);
  } else {
    if (autoImport) await sleep(2000);
    const diagnostics = languages
      .getDiagnostics(document.uri)
      .filter((x) => [DiagnosticSeverity.Error, DiagnosticSeverity.Warning].includes(x.severity));
    assert.strictEqual(diagnostics.length, 0, JSON.stringify(diagnostics));
  }
};

suiteSetup(function (done) {
  this.timeout(5000);
  sleep(2000).then(() => done());
});

suite('Extension Test Suite', async function () {
  this.timeout(5000);

  test('Simple function', async () => {
    try {
      const textEditor = await window.showTextDocument(getUri('f1'));
      await performTypeGeneration('f1()', textEditor.document, { expectedType: 'void' });
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Simple property', async () => {
    try {
      const textEditor = await window.showTextDocument(getUri('p1'));
      await performTypeGeneration('_p1_', textEditor.document, { expectedType: 'number' });
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Getter property', async () => {
    try {
      const textEditor = await window.showTextDocument(getUri('p2'));
      await performTypeGeneration('p2()', textEditor.document, { expectedType: 'number' });
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Arrow function', async () => {
    try {
      const name = 'a1';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document);
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Long arrow function', async () => {
    try {
      const name = 'a2';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document);
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Arrow function with complex argument', async () => {
    try {
      const name = 'a3';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document);
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Complex array', async () => {
    try {
      const name = 'arr1';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document);
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Simple import', async () => {
    try {
      const name = 'imp1';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document, { autoImport: true });
    } catch (e) {
      assert.fail(e);
    }
  });

  test('Complex import', async () => {
    try {
      const name = 'imp2';
      const textEditor = await window.showTextDocument(getUri(name));
      await performTypeGeneration(name, textEditor.document, { autoImport: true });
    } catch (e) {
      assert.fail(e);
    }
  });
});