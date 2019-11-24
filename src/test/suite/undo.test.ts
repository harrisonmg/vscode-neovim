import vscode from "vscode";
import { NeovimClient } from "neovim";

import {
    attachTestNvimClient,
    sendVSCodeKeys,
    assertContent,
    wait,
    sendEscapeKey,
    closeAllActiveEditors,
    closeNvimClient,
} from "../utils";

describe("Undo", () => {
    let client: NeovimClient;
    before(async () => {
        client = await attachTestNvimClient();
    });
    after(async () => {
        await closeNvimClient(client);
    });

    afterEach(async () => {
        await closeAllActiveEditors();
    });

    it("U in new buffer doesnt undo initial content", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "some line\notherline",
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        await wait();
        await sendVSCodeKeys("u");
        await assertContent(
            {
                content: ["some line", "otherline"],
            },
            client,
        );
    });

    it("Undo points are correct after the insert mode", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "some line\notherline",
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        await wait();
        // for some reason sending both jA fails
        await sendVSCodeKeys("j");
        await sendVSCodeKeys("A");
        await sendVSCodeKeys("\nblah");
        await sendEscapeKey();

        await sendVSCodeKeys("A");
        await sendVSCodeKeys("\nblah");
        await sendEscapeKey();

        await assertContent(
            {
                content: ["some line", "otherline", "blah", "blah"],
            },
            client,
        );

        await sendVSCodeKeys("u");
        await assertContent(
            {
                content: ["some line", "otherline", "blah"],
            },
            client,
        );

        await sendVSCodeKeys("u");
        await assertContent(
            {
                content: ["some line", "otherline"],
            },
            client,
        );
    });

    it("Buffer is ok after undo and o", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "a\nb",
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        await wait();
        await sendVSCodeKeys("yy");
        await sendVSCodeKeys("p");
        await sendVSCodeKeys("u");
        await sendVSCodeKeys("o");

        await sendEscapeKey();
        await assertContent(
            {
                content: ["a", "", "b"],
            },
            client,
        );
    });
});
