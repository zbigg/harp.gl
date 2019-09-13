/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

// Borrowed and adapted from:
// https://github.com/cyco130/ts-transformer-unassert/blob/master/src/index.ts

/*
 * MIT License
 * Copyright (c) 2018 cyco130

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as ts from "typescript";

interface Options {
    removedFunctionNames: string[];
}

export const defaultOptions = {
    removedFunctionNames: ["assert", "assertExists"]
};

export function createTransformer(options?: Options): ts.TransformerFactory<ts.SourceFile> {
    const { removedFunctionNames } = { ...defaultOptions, ...options };
    return context => {
        const visitor: ts.Visitor = node => {
            if (
                ts.isImportDeclaration(node) &&
                node.importClause &&
                node.importClause.namedBindings &&
                ts.isNamedImports(node.importClause.namedBindings) &&
                node.importClause.namedBindings.elements.length === 1 &&
                removedFunctionNames.includes(node.importClause.namedBindings.elements[0].name
                    .escapedText as string)
            ) {
                console.log("unassert: removed import", node.getText());
                return ts.createEmptyStatement();
            }

            if (
                ts.isCallExpression(node) &&
                ts.isIdentifier(node.expression) &&
                removedFunctionNames.includes(node.expression.escapedText as string)
            ) {
                console.log("unassert: removed call", node.getText());
                return ts.createVoidZero();
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return node => ts.visitNode(node, visitor);
    };
}
const transformer: ts.TransformerFactory<ts.SourceFile> = createTransformer(defaultOptions);

export default transformer;
